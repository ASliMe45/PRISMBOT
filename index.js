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

// ===== KEEP PROCESS ACTIVE =====
// Prevents Node.js from closing the process if there is no activity
setInterval(() => {}, 1000 * 60 * 60);

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
            console.log(chalk.red(`❌ Error requesting pairing code: ${error?.message || error}. Waiting 1 min to retry...`));
            setTimeout(requestPairing, 60 * 1000);
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
            const reason = err?.output?.statusCode || err?.statusCode || err?.name || err;
            console.log(chalk.red('⚠️ Connection closed. Reason detail:'), err || reason);
            
            // If the session was logged out (401), stop pairing attempts and instruct the user
            if (reason === DisconnectReason.loggedOut || reason === 401) {
                console.log(chalk.red('❌ Session closed. Delete ./session to connect again.'));
                pairingBlocked = true;
                try { if (pairingInterval) { clearInterval(pairingInterval); pairingInterval = null; } } catch (e) {}
                try { if (pairingSafety) { clearInterval(pairingSafety); pairingSafety = null; } } catch (e) {}
                return; // do not attempt to reconnect automatically
            }

            // Retry connection for other reasons
            console.log(chalk.yellow('🔄 Reconnecting in 5 seconds...'));
            setTimeout(() => startBot(), 5000);
        } else if (connection === 'open') {
            console.log(chalk.green.bold('✅ PRISMBOT CONNECTED SUCCESSFULLY'));
            
            // Stop pairing timers if any (safety)
            try { if (pairingInterval) { clearInterval(pairingInterval); pairingInterval = null; } } catch (e) {}
            try { if (pairingSafety) { clearInterval(pairingSafety); pairingSafety = null; } } catch (e) {}

            // Send boot message to newsletter
            try {
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
            } catch (e) {
                console.error('Error sending boot message to newsletter:', e);
            }
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