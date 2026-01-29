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
    const requestPairing = async () => {
        if (!sock.authState.creds.registered) {
            const phoneNumber = settings.pairingNumber.replace(/[^0-9]/g, '');
            console.log(chalk.cyan(`🔹 Attempting to generate code for: ${phoneNumber}`));
            
            // Wait 15 seconds for socket to stabilize
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(chalk.black.bgGreen.bold(`\n YOUR PAIRING CODE: ${code} \n`));
            } catch (error) {
                console.log(chalk.red(`❌ Error 428: WhatsApp rejected the request. Waiting 5 min to retry...`));
                // Retry in 5 minutes
                setTimeout(requestPairing, 300000);
            }
        }
    };

    // Request code if not registered
    if (!sock.authState.creds.registered) {
        requestPairing();
    }

    // ===== SOCKET EVENTS =====
    
    /**
     * Event: Update saved credentials
     * Executed when Baileys updates credentials
     */
    sock.ev.on('creds.update', saveCreds);

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
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(chalk.red(`⚠️ Connection closed. Reason: ${reason}`));
            
            // Retry connection if it was not a voluntary logout
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.yellow('🔄 Reconnecting in 5 seconds...'));
                setTimeout(() => startBot(), 5000);
            } else {
                console.log(chalk.red('❌ Session closed. Delete ./session to connect again.'));
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold('✅ PRISMBOT CONNECTED SUCCESSFULLY'));
            
            // Send message to newsletter
            try {
                const botStats = stats.get();
                const uptime = process.uptime();
                
                const bootMessage = `
╔════════════════════════════════════════════╗
║     🤖 ${settings.botName} - SUCCESSFULLY BOOTED 🚀     ║
╚════════════════════════════════════════════╝

⏰ BOOT TIME: ${new Date().toLocaleString('en-US')}

📊 BOT STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ Status: OPERATIONAL
  🟢 Connection: ACTIVE
  📱 Version: ${settings.version}
  👨‍💼 Owner: @${settings.ownerNumber}
  📝 Commands: ${botStats.commands || 0}
  👥 Groups: ${botStats.groups?.length || 0}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 The bot is ready to receive commands
   Type .help to see available commands

🔧 Author: ${settings.author}
🏠 Repository: ${settings.github.repo}

═════════════════════════════════════════════
       BOT READY TO DOMINATE THE WORLD! 🌍
═════════════════════════════════════════════
`.trim();

                // Send to newsletter
                await sock.sendMessage(settings.newsletter.jid, { 
                    text: bootMessage
                });
            } catch (e) {
                console.error('Error sending boot message to newsletter:', e);
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