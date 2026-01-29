/**
 * ARCHIVO PRINCIPAL DEL BOT PRISMBOT
 * Inicia la conexión con WhatsApp y maneja los eventos principales
 */

// ===== IMPORTACIONES =====
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
const settings = require('./settings');

// ===== MANTENER EL PROCESO ACTIVO =====
// Evita que Node.js cierre el proceso si no hay actividad
setInterval(() => {}, 1000 * 60 * 60);

/**
 * Inicia el bot de WhatsApp
 * Configura el socket, maneja autenticación y eventos
 */
async function startBot() {
    // Obtener estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    const { version } = await fetchLatestBaileysVersion();

    // ===== CONFIGURACIÓN DEL SOCKET DE WHATSAPP =====
    const sock = makeWASocket({
        version,                                                      // Versión de Baileys
        logger: pino({ level: 'silent' }),                          // Logger silencioso
        printQRInTerminal: false,                                   // No mostrar QR en terminal
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: ["Chrome (Linux)", "PrismBot", "1.0.0"],           // Nombre del navegador
        syncFullHistory: false,                                      // No sincronizar historial
        markOnlineOnConnect: true,                                  // Marcar como conectado
    });

    /**
     * Solicita el código de vinculación si no está registrado
     * Reintenta cada 5 minutos si falla
     */
    const requestPairing = async () => {
        if (!sock.authState.creds.registered) {
            const phoneNumber = settings.pairingNumber.replace(/[^0-9]/g, '');
            console.log(chalk.cyan(`🔹 Intentando generar código para: ${phoneNumber}`));
            
            // Esperamos 15 segundos para que el socket se estabilice
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            try {
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(chalk.black.bgGreen.bold(`\n TU CÓDIGO DE VINCULACIÓN: ${code} \n`));
            } catch (error) {
                console.log(chalk.red(`❌ Error 428: WhatsApp rechazó la petición. Esperando 5 min para reintentar...`));
                // Reintentar en 5 minutos
                setTimeout(requestPairing, 300000);
            }
        }
    };

    // Solicitar código si no está registrado
    if (!sock.authState.creds.registered) {
        requestPairing();
    }

    // ===== EVENTOS DEL SOCKET =====
    
    /**
     * Evento: Guardar credenciales actualizadas
     * Se ejecuta cuando Baileys actualiza las credenciales
     */
    sock.ev.on('creds.update', saveCreds);

    /**
     * Evento: Actualización de participantes en grupos
     * Maneja bienvenidas automáticas cuando alguien entra
     */
    sock.ev.on('group-participants.update', async (anu) => {
        const { id, participants, action } = anu;
        
        // Solo actuar si alguien fue añadido al grupo
        if (action === 'add') {
            const conf = getWelcome(id);
            
            // Verificar si el grupo tiene bienvenidas habilitadas
            if (conf && conf.status) {
                try {
                    const metadata = await sock.groupMetadata(id);
                    
                    // Enviar mensaje de bienvenida a cada nuevo miembro
                    for (let num of participants) {
                        let msg = conf.message || "Bienvenido @user";
                        msg = msg.replace('@user', `@${num.split('@')[0]}`).replace('@group', metadata.subject);
                        await sock.sendMessage(id, { text: msg, mentions: [num] });
                    }
                } catch (e) {
                    console.error('Error al enviar bienvenida:', e);
                }
            }
        }
    });

    /**
     * Evento: Nuevos mensajes
     * Procesa todos los mensajes entrantes
     */
    sock.ev.on('messages.upsert', async chatUpdate => {
        if (chatUpdate.type === 'notify') {
            await handleMessages(sock, chatUpdate);
        }
    });

    /**
     * Evento: Cambios de conexión
     * Maneja desconexiones y reconexiones automáticas
     */
    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(chalk.red(`⚠️ Conexión cerrada. Razón: ${reason}`));
            
            // Reintentar conexión si no fue cierre voluntario
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.yellow('🔄 Reconectando en 5 segundos...'));
                setTimeout(() => startBot(), 5000);
            } else {
                console.log(chalk.red('❌ Sesión cerrada. Elimina ./session para conectar de nuevo.'));
            }
        } else if (connection === 'open') {
            console.log(chalk.green.bold('✅ PRISMBOT CONECTADO CORRECTAMENTE'));
        }
    });

    return sock;
}

// Iniciar el bot y capturar errores críticos
startBot().catch(err => {
    console.error(chalk.red("Error crítico al iniciar el bot:"), err);
    process.exit(1);
});