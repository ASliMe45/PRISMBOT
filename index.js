const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const { handleMessages } = require('./main');
const { getWelcome } = require('./lib/index');
const settings = require('./settings');

// Forzamos al proceso a no cerrarse nunca
setInterval(() => {}, 1000 * 60 * 60); 

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        // Cambiamos el nombre del navegador para resetear la identidad del intento
        browser: ["Chrome (Linux)", "PrismBot", "1.0.0"],
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    // Función para pedir el código de forma segura
    const requestPairing = async () => {
        if (!sock.authState.creds.registered) {
            const phoneNumber = settings.pairingNumber.replace(/[^0-9]/g, '');
            console.log(chalk.cyan(`🔹 Intentando generar código para: ${phoneNumber}`));
            
            // Esperamos un poco más para que el socket se estabilice
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(chalk.black.bgGreen.bold(`\n TU CÓDIGO DE VINCULACIÓN: ${code} \n`));
            } catch (error) {
                console.log(chalk.red(`❌ Error 428: WhatsApp rechazó la petición. Esperando 5 min para reintentar...`));
                // No matamos el proceso, solo esperamos
                setTimeout(requestPairing, 300000); 
            }
        }
    };

    // Solo pedimos el código si no estamos registrados
    if (!sock.authState.creds.registered) {
        requestPairing();
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('group-participants.update', async (anu) => {
        const { id, participants, action } = anu;
        if (action === 'add') {
            const conf = getWelcome(id);
            if (conf && conf.status) {
                try {
                    const metadata = await sock.groupMetadata(id);
                    for (let num of participants) {
                        let msg = conf.message || "Bienvenido @user";
                        msg = msg.replace('@user', `@${num.split('@')[0]}`).replace('@group', metadata.subject);
                        await sock.sendMessage(id, { text: msg, mentions: [num] });
                    }
                } catch (e) {}
            }
        }
    });

    sock.ev.on('messages.upsert', async chatUpdate => {
        if (chatUpdate.type === 'notify') {
            await handleMessages(sock, chatUpdate);
        }
    });

    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(chalk.red(`⚠️ Conexión cerrada. Razón: ${reason}`));
            
            // Si no fue un cierre voluntario, reiniciamos
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold('✅ PRISMBOT CONECTADO CORRECTAMENTE'));
        }
    });

    return sock;
}

startBot().catch(err => console.error("Error crítico:", err));