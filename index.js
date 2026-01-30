/**
 * PRISMBOT MAIN FILE
 * Starts the WhatsApp connection and handles main events
 */

// ===== IMPORTS =====
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore 
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const { handleMessages } = require('./main');
const { getWelcome } = require('./lib/index');
const stats = require('./lib/stats');
const settings = require('./settings');
const fs = require('fs');
const path = require('path');

// ===== RECONNECTION / PAIRING BACKOFF =====
let reconnectAttempts = 0;               // number of reconnect attempts
let maxReconnectDelay = 300000;         // 5 minutes max
let wasReconnecting = false;            // flag to detect whether open is from a reconnect

function scheduleReconnect() {
    wasReconnecting = true;
    reconnectAttempts = Math.min(reconnectAttempts + 1, 20);

    // Base exponential backoff (5s, 10s, 20s, ...), cap to maxReconnectDelay
    let delay = Math.min(maxReconnectDelay, 5000 * Math.pow(2, reconnectAttempts - 1));

    // Add jitter ±25% to avoid thundering herd
    const jitter = Math.floor((Math.random() - 0.5) * 0.5 * delay);
    delay = Math.max(1000, delay + jitter);

    console.log(chalk.yellow(`🔁 Scheduling reconnect in ${Math.round(delay/1000)}s (attempt ${reconnectAttempts})`));
    setTimeout(() => {
        console.log(chalk.yellow('🔄 Reconnect attempt starting...'));
        startBot();
    }, delay);
}

// ===== KEEP PROCESS ACTIVE =====
// Prevents Node.js from closing the process if there is no activity
setInterval(() => {}, 1000 * 60 * 60);

// ===== CONNECTION ERROR LOGGING =====
function logConnectionError(err) {
    try {
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
        const logPath = path.join(logsDir, 'connection-errors.log');
        const payload = (err && err.output && err.output.payload) ? err.output.payload : err;
        const entry = {
            ts: new Date().toISOString(),
            reason: payload,
            raw: (err && err.stack) ? String(err.stack) : String(err)
        };
        fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    } catch (e) {
        console.error('Failed writing connection log:', e);
    }
}

/**
 * Starts the WhatsApp bot
 * Configures socket, handles authentication and events
 */
async function startBot() {
    // Get authentication state
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const { version } = await fetchLatestBaileysVersion();
const QRCode = require('qrcode');

    // ===== WHATSAPP SOCKET CONFIGURATION =====
    const sock = makeWASocket({
        version,                                                      // Baileys version
        logger: pino({ level: 'silent' }),                          // Silent logger
        printQRInTerminal: false,                                   // Don't show QR in terminal
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Chrome (Linux)", "PrismBot", "1.0.0"],           // Browser name
        syncFullHistory: false,                                      // Don't sync history
        markOnlineOnConnect: true,                                  // Mark as online on connect
    });

    /**
     * Request pairing code if not registered
     * Retries every 5 minutes if it fails
     */
    // Pairing helpers
    let pairingInterval = null;
    let pairingSafety = null;
    let lastPairing = null;
    let pairingBlocked = false; // set to true when session is logged out (stop further pairing attempts)

    // pairing backoff attempts
    let pairingBackoffAttempts = 0;

    const schedulePairingRetry = (reason) => {
        if (pairingBlocked) { console.log(chalk.yellow('⏱️ Pairing blocked; not scheduling pairing retry.')); return; }
        pairingBackoffAttempts = Math.min(pairingBackoffAttempts + 1, 6); // cap
        const delay = Math.min(10 * 60 * 1000, 30 * 1000 * Math.pow(2, pairingBackoffAttempts - 1)); // 30s,60s,120s,... cap 10m
        console.log(chalk.yellow(`⏱️ Scheduling pairing retry in ${Math.round(delay/1000)}s (attempt ${pairingBackoffAttempts})${reason ? ' - ' + reason : ''}`));
        setTimeout(() => {
            if (pairingBlocked) { console.log(chalk.yellow('⏱️ Pairing blocked; skipping scheduled pairing retry.')); return; }
            requestPairing();
        }, delay);
    }

    const requestPairing = async () => {
        if (pairingBlocked) { console.log(chalk.red('⛔ Pairing blocked due to logged out session. Remove ./session and restart to pair.')); return; }
        if (sock.authState.creds.registered) return;
        const phoneNumber = settings.pairingNumber.replace(/[^0-9]/g, '');
        console.log(chalk.cyan(`🔹 Attempting to generate pairing code for: ${phoneNumber}`));

        // Short delay to let socket stabilize
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
            const res = await sock.requestPairingCode(phoneNumber);
            // Different Baileys versions may return string or object
            let codeStr = '';
            if (!res) codeStr = 'UNKNOWN';
            else if (typeof res === 'string') codeStr = res;
            else if (res.code) codeStr = String(res.code);
            else if (res.pin) codeStr = String(res.pin);
            else codeStr = JSON.stringify(res);

            // Reset backoff on success
            pairingBackoffAttempts = 0;

            lastPairing = { code: codeStr, issuedAt: Date.now() };
            console.log(chalk.black.bgGreen.bold(`\n YOUR PAIRING CODE: ${codeStr} \n`));
            console.log(chalk.yellow('⚠️ Pairing code displayed in console only (not sent to newsletter).'));

            // Setup periodic re-request of pairing code (every 2 minutes) until registered
            if (pairingInterval) clearInterval(pairingInterval);
            pairingInterval = setInterval(async () => {
                if (pairingBlocked) { console.log(chalk.red('⛔ Pairing blocked; skipping re-request.')); return; }
                if (sock.authState.creds.registered) { clearInterval(pairingInterval); pairingInterval = null; return; }
                // Only attempt if socket WebSocket is open
                if (!sock?.ws || sock.ws.readyState !== 1) { console.log(chalk.yellow('⚠️ Socket not ready; skipping pairing re-request.')); return; }
                try {
                    const r = await sock.requestPairingCode(phoneNumber);
                    let c = typeof r === 'string' ? r : (r.code || r.pin || JSON.stringify(r));
                    if (c && c !== codeStr) {
                        codeStr = c;
                        lastPairing = { code: codeStr, issuedAt: Date.now() };
                        console.log(chalk.black.bgGreen.bold(`\n UPDATED PAIRING CODE: ${codeStr} \n`));
                        console.log(chalk.yellow('⚠️ Updated pairing code displayed in console only.'));
                    }
                } catch (err) {
                    console.log(chalk.red('Pairing re-request failed, will retry later:', err?.message || err));
                }
            }, 2 * 60 * 1000);

        } catch (error) {
            console.log(chalk.red(`❌ Error requesting pairing code: ${error?.message || error}.`));
            schedulePairingRetry(error?.message || String(error));
        }
    };

    // Start requesting code if not registered and set a safety retry every 5 minutes
    if (!sock.authState.creds.registered) {
        requestPairing();
        if (pairingSafety) clearInterval(pairingSafety);
        pairingSafety = setInterval(() => {
            if (sock.authState.creds.registered) { clearInterval(pairingSafety); pairingSafety = null; return; }
            requestPairing();
        }, 5 * 60 * 1000);
    }

    // ===== SOCKET EVENTS =====
    
    /**
     * Event: Update saved credentials
     * Executed when Baileys updates credentials
     */
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('creds.update', () => {
        // If registered, stop pairing timers
        if (sock.authState && sock.authState.creds && sock.authState.creds.registered) {
            console.log(chalk.green('🔐 Credentials updated and registered. Clearing pairing timers.'));
            try { if (pairingInterval) { clearInterval(pairingInterval); pairingInterval = null; } } catch (e) {}
            try { if (pairingSafety) { clearInterval(pairingSafety); pairingSafety = null; } } catch (e) {}
            // Credentials updated and registered — log only (no external notification)
            console.log(chalk.green(`✅ Device successfully paired for ${settings.botName}.`));
        }
    });

    /**
     * Event: Group participant updates
     * Handles automatic greetings when someone joins
     */
    sock.ev.on('group-participants.update', async (anu) => {
        const { id, participants, action } = anu;
        
        // Only act if someone was added to the group
        if (action === 'add') {
            const conf = getWelcome(id);
            
            // Check if group has greetings enabled
            if (conf && conf.status) {
                try {
                    const metadata = await sock.groupMetadata(id);
                    
                    // Send greeting message to each new member
                    for (let num of participants) {
                        let msg = conf.message || "Welcome @user";
                        msg = msg.replace('@user', `@${num.split('@')[0]}`).replace('@group', metadata.subject);
                        await sock.sendMessage(id, { text: msg, mentions: [num] });
                    }
                } catch (e) {
                    console.error('Error sending welcome message:', e);
                }
            }
        }
    });

    /**
     * Event: New messages
     * Processes all incoming messages
     */
    sock.ev.on('messages.upsert', async chatUpdate => {
        if (chatUpdate.type === 'notify') {
            await handleMessages(sock, chatUpdate);
        }
    });

    /**
     * Event: Connection changes
     * Handles disconnections and automatic reconnections
     * Sends connection notification to newsletter
     */
    sock.ev.on('connection.update', async (u) => {
        const { connection, lastDisconnect } = u;
        
        if (connection === 'close') {
            // Provide detailed disconnect info
            const err = lastDisconnect?.error || lastDisconnect;
            // Persist the error locally for diagnosis
            try { logConnectionError(err); } catch (e) { /* ignore logging failures */ }
            const rawStatus = err?.output?.statusCode || err?.statusCode || null;
            const reason = err?.name || rawStatus || err;
            console.log(chalk.red('⚠️ Connection closed. Reason detail:'), err || reason);
            
            // If the session was logged out (401), stop pairing attempts and instruct the user
            if (rawStatus === 401 || reason === DisconnectReason.loggedOut) {
                console.log(chalk.red('❌ Session closed. Delete ./session to connect again.'));
                pairingBlocked = true;
                try { if (pairingInterval) { clearInterval(pairingInterval); pairingInterval = null; } } catch (e) {}
                try { if (pairingSafety) { clearInterval(pairingSafety); pairingSafety = null; } } catch (e) {}
                return; // do not attempt to reconnect automatically
            }

            // Stream/server errors (503/515/5xx) -> escalate reconnect attempts and schedule backoff
            if (rawStatus === 515 || rawStatus === 503 || (typeof rawStatus === 'number' && rawStatus >= 500)) {
                console.log(chalk.yellow(`⚠️ Stream/server error (${rawStatus}). Scheduling reconnect with backoff.`));
                reconnectAttempts = Math.min(reconnectAttempts + 1, 20);
                scheduleReconnect();
                return;
            }

            // Other transient reasons -> schedule reconnect with backoff
            console.log(chalk.yellow('🔄 Connection closed, scheduling reconnect (backoff).'));
            scheduleReconnect();
        } else if (connection === 'open') {
            // Reset reconnect attempts on successful open
            reconnectAttempts = 0;
            console.log(chalk.green.bold('✅ PRISMBOT CONNECTED SUCCESSFULLY'));
            
            // Stop pairing timers if any (safety)
            try { if (pairingInterval) { clearInterval(pairingInterval); pairingInterval = null; } } catch (e) {}
            try { if (pairingSafety) { clearInterval(pairingSafety); pairingSafety = null; } } catch (e) {}

            // Send boot message to newsletter only on fresh boot (not every reconnect)
            try {
                if (!wasReconnecting) {
                    const botStats = stats.get();
                    const uptime = process.uptime();
                    
                    const bootMessage = `
*🤖 ${settings.botName} - SUCCESSFULLY BOOTED 🚀*

*⏰ BOOT TIME:* ${new Date().toLocaleString('en-US')}

*📊 BOT STATISTICS:*

  *✅ Status:* OPERATIONAL
  *🟢 Connection:* ACTIVE
  *📱 Version:* ${settings.version}
  *👨‍💼 Owner:* @${settings.ownerNumber}
  *📝 Commands:* ${botStats.commands || 0}
  *👥 Groups:* ${botStats.groups?.length || 0}

💬 The bot is ready to receive commands
   Type .help to see available commands

*🔧 Author:* ${settings.author}
*🏠 Repository:* ${settings.github.repo}

*BOT READY TO DOMINATE THE WORLD! 🌍*
`.trim();

                    // Send to newsletter
                    await sock.sendMessage(settings.newsletter.jid, { 
                        text: bootMessage
                    });
                } else {
                    console.log(chalk.yellow('⚠️ Skipping newsletter boot message due to recent reconnect.'));
                }
            } catch (e) {
                console.error('Error sending boot message to newsletter:', e);
            }

            // We're now open and handled, clear the reconnecting flag
            wasReconnecting = false;
        }

        // If WhatsApp provides a QR payload, show it in the terminal only (ASCII + raw). Do NOT send anywhere.
        if (u.qr) {
            try {
                if (!u.qr || u.qr === (global.__lastQrSent__)) return;
                global.__lastQrSent__ = u.qr;

                // Show QR in terminal (ASCII) and raw text only
                try {
                    // Smaller ASCII QR for easier scanning on mobile devices
                    const ascii = await QRCode.toString(u.qr, { type: 'terminal', small: true });
                    console.log(chalk.cyan('\nPAIRING QR (scan this with WhatsApp -> Link a device):\n'));
                    console.log(ascii);
                } catch (e) {
                    console.log(chalk.yellow('⚠️ Could not generate ASCII QR, showing raw QR string instead.'));
                    console.log(chalk.black.bgGreen.bold(`\n RAW QR: ${u.qr} \n`));
                }

                if (lastPairing && lastPairing.code) {
                    console.log(chalk.black.bgGreen.bold(`\n YOUR PAIRING CODE: ${lastPairing.code} \n`));
                }

                console.log(chalk.green('✅ QR shown in console only; not sent anywhere.'));
            } catch (e) {
                console.error('Error showing QR in console:', e);
            }
        }
    });

    return sock;
}

// Start bot and capture critical errors
startBot().catch(err => {
    console.error(chalk.red("Critical error starting bot:"), err);
    process.exit(1);
});