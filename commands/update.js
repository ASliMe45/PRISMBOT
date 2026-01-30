const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');

// --- FUNCIONES DE APOYO ---
function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

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

async function updateViaGit() {
    await run('git fetch --all --prune');
    const branch = settings.github.branch || 'main';
    const newRev = (await run(`git rev-parse origin/${branch}`)).trim();
    await run(`git reset --hard origin/${branch}`);
    await run('git clean -fd');
    return { newRev };
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? require('https') : require('http');
        client.get(url, { headers: { 'User-Agent': 'PrismBot-Updater' } }, res => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', reject);
    });
}

async function extractZip(zipPath, outDir) {
    try {
        await run(`unzip -o '${zipPath}' -d '${outDir}'`);
    } catch {
        throw new Error("No se encontró 'unzip' en el sistema. Se recomienda usar modo Git.");
    }
}

function copyRecursive(src, dest, ignore = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        if (fs.lstatSync(s).isDirectory()) {
            copyRecursive(s, d, ignore);
        } else {
            fs.copyFileSync(s, d);
        }
    }
}

// --- COMANDO PRINCIPAL ---
module.exports = {
    name: 'update',
    alias: ['actualizar', 'upd'],
    async execute(sock, chatId, m, { senderIsOwner }) {
        if (!senderIsOwner) return;

        try {
            await sock.sendMessage(chatId, { text: '🔄 *PRISMBOT UPDATE*\n\nIniciando actualización inteligente... espera.' });

            if (await hasGitRepo()) {
                // MODO GIT
                const { newRev } = await updateViaGit();
                await run('npm install --no-audit --no-fund');
                await sock.sendMessage(chatId, { text: `✅ Actualizado vía Git (Rev: ${newRev.slice(0,7)})\n\nReiniciando...` });
            } else {
                // MODO ZIP (FALLBACK)
                const zipUrl = `https://github.com/ASliMe45/PRISMBOT/archive/refs/heads/${settings.github.branch || 'main'}.zip`;
                const tmpDir = path.join(process.cwd(), 'tmp');
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
                
                const zipPath = path.join(tmpDir, 'update.zip');
                await downloadFile(zipUrl, zipPath);
                
                const extractTo = path.join(tmpDir, 'extract');
                if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
                await extractZip(zipPath, extractTo);

                const root = fs.readdirSync(extractTo).map(n => path.join(extractTo, n))[0];
                const ignore = ['node_modules', '.git', 'session', 'tmp', 'data', 'baileys_store.json', 'settings.js'];
                
                copyRecursive(root, process.cwd(), ignore);
                
                // Limpieza
                fs.rmSync(tmpDir, { recursive: true, force: true });
                await run('npm install');
                await sock.sendMessage(chatId, { text: '✅ Actualizado vía ZIP (Ignorando settings.js)\n\nReiniciando...' });
            }

            // Reiniciar proceso
            setTimeout(() => { process.exit(0); }, 3000);

        } catch (err) {
            console.error('Update failed:', err);
            await sock.sendMessage(chatId, { text: `❌ *ERROR EN UPDATE*\n\n${err.message}` });
        }
    }
};