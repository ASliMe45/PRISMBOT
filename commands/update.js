const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const settings = require('../settings');

/**
 * Execute system commands
 */
function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

/**
 * Check if Git repository exists
 */
async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try {
        await run('git --version');
        return true;
    } catch {
        return false;
    }
}

/**
 * Update via Git (better version with commit info)
 */
async function updateViaGit() {
    const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
    await run('git fetch --all --prune');
    const newRev = (await run('git rev-parse origin/main')).trim();
    const alreadyUpToDate = oldRev === newRev;
    const commits = alreadyUpToDate ? '' : await run(`git log --pretty=format:"%h %s (%an)" ${oldRev}..${newRev}`).catch(() => '');
    const files = alreadyUpToDate ? '' : await run(`git diff --name-status ${oldRev} ${newRev}`).catch(() => '');
    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');
    return { oldRev, newRev, alreadyUpToDate, commits, files };
}

/**
 * Download file with proper redirect handling and error management
 */
function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            // Avoid infinite redirect loops
            if (visited.has(url) || visited.size > 5) {
                return reject(new Error('❌ Too many redirects'));
            }
            visited.add(url);

            const useHttps = url.startsWith('https://');
            const client = useHttps ? https : http;
            
            const req = client.get(url, {
                headers: {
                    'User-Agent': 'PrismBot-Updater/1.0',
                    'Accept': '*/*'
                }
            }, res => {
                // Handle HTTP redirects (301, 302, 303, 307, 308)
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;
                    if (!location) return reject(new Error(`❌ HTTP ${res.statusCode} without Location header`));
                    const nextUrl = new URL(location, url).toString();
                    res.resume();
                    return downloadFile(nextUrl, dest, visited).then(resolve).catch(reject);
                }

                if (res.statusCode !== 200) {
                    return reject(new Error(`❌ HTTP ${res.statusCode}`));
                }

                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
                file.on('error', err => {
                    try { file.close(() => {}); } catch {}
                    fs.unlink(dest, () => reject(err));
                });
            });
            
            req.on('error', err => {
                fs.unlink(dest, () => reject(err));
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Extract ZIP file with multiple methods (cross-platform)
 */
async function extractZip(zipPath, outDir) {
    // Windows: Use PowerShell
    if (process.platform === 'win32') {
        const cmd = `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${outDir.replace(/\\/g, '/')}' -Force"`;
        await run(cmd);
        return;
    }

    // Linux/Mac: Try multiple tools
    try {
        await run('command -v unzip');
        await run(`unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}

    try {
        await run('command -v 7z');
        await run(`7z x -y '${zipPath}' -o'${outDir}'`);
        return;
    } catch {}

    try {
        await run('busybox unzip -h');
        await run(`busybox unzip -o '${zipPath}' -d '${outDir}'`);
        return;
    } catch {}

    throw new Error('❌ No system unzip tool found (unzip/7z/busybox). Git mode is recommended.');
}

/**
 * Recursively copy files while respecting ignore list
 */
function copyRecursive(src, dest, ignore = [], relative = '', outList = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.lstatSync(s);
        if (stat.isDirectory()) {
            copyRecursive(s, d, ignore, path.join(relative, entry), outList);
        } else {
            fs.copyFileSync(s, d);
            if (outList) outList.push(path.join(relative, entry).replace(/\\/g, '/'));
        }
    }
}

/**
 * Update via ZIP download (fallback method)
 */
async function updateViaZip(zipUrl) {
    if (!zipUrl) {
        throw new Error('❌ No ZIP URL configured. Set settings.updateZipUrl or UPDATE_ZIP_URL env.');
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    const zipPath = path.join(tmpDir, 'update.zip');
    await downloadFile(zipUrl, zipPath);
    
    const extractTo = path.join(tmpDir, 'update_extract');
    if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
    await extractZip(zipPath, extractTo);

    // Find the top-level extracted folder (GitHub zips create REPO-branch folder)
    const [root] = fs.readdirSync(extractTo).map(n => path.join(extractTo, n));
    const srcRoot = fs.existsSync(root) && fs.lstatSync(root).isDirectory() ? root : extractTo;

    // Preserve important settings before copy
    let preservedOwner = null;
    let preservedBotOwner = null;
    try {
        const currentSettings = require('../settings');
        preservedOwner = currentSettings && currentSettings.ownerNumber ? String(currentSettings.ownerNumber) : null;
        preservedBotOwner = currentSettings && currentSettings.botOwner ? String(currentSettings.botOwner) : null;
    } catch {}

    // Copy files while ignoring runtime data
    const ignore = ['node_modules', '.git', 'session', 'tmp', 'tmp/', 'temp', 'data', 'baileys_store.json'];
    const copied = [];
    copyRecursive(srcRoot, process.cwd(), ignore, '', copied);

    // Restore settings.js with original ownerNumber
    if (preservedOwner) {
        try {
            const settingsPath = path.join(process.cwd(), 'settings.js');
            if (fs.existsSync(settingsPath)) {
                let text = fs.readFileSync(settingsPath, 'utf8');
                text = text.replace(/ownerNumber:\s*'[^']*'/, `ownerNumber: '${preservedOwner}'`);
                if (preservedBotOwner) {
                    text = text.replace(/botOwner:\s*'[^']*'/, `botOwner: '${preservedBotOwner}'`);
                }
                fs.writeFileSync(settingsPath, text);
            }
        } catch (e) {
            console.error('Error preserving settings:', e.message);
        }
    }

    // Cleanup
    try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(zipPath, { force: true }); } catch {}

    return { copiedFiles: copied };
}

/**
 * Restart the process (try PM2 first, then exit)
 */
async function restartProcess(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '✅ Update complete! Restarting…' }, { quoted: message });
    } catch {}

    try {
        // Try PM2 first
        await run('pm2 restart all');
        return;
    } catch {}

    // Fallback: exit (panels auto-restart)
    setTimeout(() => {
        process.exit(0);
    }, 500);
}

/**
 * Main update command
 */
async function updateCommand(sock, chatId, message) {
    const senderIsOwner = message.key.fromMe || 
        (message.key.participant || message.key.remoteJid).split('@')[0] === 
        settings.ownerNumber.replace(/[^0-9]/g, '');

    if (!senderIsOwner) {
        await sock.sendMessage(chatId, { text: '❌ Only bot owner can use .update' }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: '🔄 Updating the bot, please wait…' }, { quoted: message });

        if (await hasGitRepo()) {
            // Git mode
            const { oldRev, newRev, alreadyUpToDate, commits, files } = await updateViaGit();
            console.log(`[UPDATE] Git: ${oldRev} → ${newRev} (${alreadyUpToDate ? 'already up-to-date' : 'updated'})`);
            
            // Install dependencies
            await run('npm install --no-audit --no-fund').catch(() => {});
        } else {
            // ZIP mode (fallback)
            const zipUrl = settings.updateZipUrl || 
                          `https://github.com/${settings.github?.repo || 'ASliMe45/PRISMBOT'}/archive/refs/heads/${settings.github?.branch || 'main'}.zip`;
            
            const { copiedFiles } = await updateViaZip(zipUrl);
            console.log(`[UPDATE] ZIP: Copied ${copiedFiles.length} files`);
            
            // Install dependencies
            await run('npm install').catch(() => {});
        }

        // Confirm update and restart
        try {
            const v = require('../settings').version || 'unknown';
            await sock.sendMessage(chatId, { text: `✅ Update done (v${v}). Restarting…` }, { quoted: message });
        } catch {
            await sock.sendMessage(chatId, { text: '✅ Update complete. Restarting…\nType .ping to verify latest version.' }, { quoted: message });
        }

        await restartProcess(sock, chatId, message);

    } catch (err) {
        console.error('[UPDATE] Error:', err);
        const errorMsg = String(err.message || err).substring(0, 100);
        await sock.sendMessage(chatId, { text: `❌ Update failed:\n${errorMsg}` }, { quoted: message });
    }
}

module.exports = {
    name: 'update',
    alias: ['actualizar', 'upd'],
    async execute(sock, chatId, m) {
        await updateCommand(sock, chatId, m);
    }
};