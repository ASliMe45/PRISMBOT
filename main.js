/**
 * PROCESADOR DE MENSAJES
 * Recibe los mensajes entrantes y ejecuta los comandos correspondientes
 */

// ===== IMPORTACIONES =====
const settings = require('./settings');
const loader = require('./lib/loader');
const isAdmin = require('./lib/isAdmin');

/**
 * Maneja los mensajes entrantes
 * Extrae comandos, parámetros y ejecuta el comando correspondiente
 * 
 * @param {object} sock - Socket de conexión de Baileys
 * @param {object} chatUpdate - Objeto de actualización del chat
 */
async function handleMessages(sock, chatUpdate) {
    try {
        // Obtener el mensaje
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;

        // ===== EXTRACCIÓN DE DATOS DEL MENSAJE =====
        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
        
        // Verificar si el mensaje comienza con el prefijo del comando
        if (!body.startsWith(settings.prefix)) return;

        // ===== PARSEO DEL COMANDO =====
        const commandName = body.slice(settings.prefix.length).trim().split(/\s+/)[0].toLowerCase();
        const args = body.trim().split(/\s+/).slice(1);
        const text = args.join(" ");
        
        // ===== VERIFICACIÓN DE PERMISOS =====
        const senderIsOwner = senderId.includes(settings.ownerNumber);
        const { isSenderAdmin, isBotAdmin } = chatId.endsWith('@g.us') 
            ? await isAdmin(sock, chatId, senderId) 
            : { isSenderAdmin: false, isBotAdmin: false };

        // ===== BÚSQUEDA Y EJECUCIÓN DEL COMANDO =====
        const commands = loader.getCommands();
        const cmd = commands.get(commandName) || [...commands.values()].find(c => c.alias?.includes(commandName));

        if (cmd) {
            await cmd.execute(sock, chatId, m, { 
                args,                           // Argumentos del comando
                text,                           // Texto del comando
                senderId,                       // ID del que envió el mensaje
                senderIsOwner,                  // ¿Es el owner?
                isSenderAdmin,                  // ¿Es admin del grupo?
                isBotAdmin,                     // ¿El bot es admin?
                commandName,                    // Nombre del comando ejecutado
                settings                        // Configuración del bot
            });
        }
    } catch (e) { 
        console.error('Error al procesar mensaje:', e); 
    }
}

module.exports = { handleMessages };