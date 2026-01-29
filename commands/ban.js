/**
 * COMANDO: BAN/KICK
 * Expulsa a un miembro del grupo
 */

module.exports = {
    name: 'ban',
    alias: ['kick', 'expulsar'],
    async execute(sock, chatId, m, { isSenderAdmin, isBotAdmin }) {
        try {
            // Verificar permisos
            if (!isSenderAdmin) {
                return sock.sendMessage(chatId, { text: "❌ Necesitas ser admin del grupo." });
            }
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, { text: "❌ Necesito ser admin del grupo." });
            }

            // Obtener usuario a banear
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return sock.sendMessage(chatId, { text: "❌ Responde al mensaje del usuario que quieres expulsar." });
            }

            // Obtener ID del usuario
            const userToBan = m.message.extendedTextMessage?.contextInfo?.participant;
            if (!userToBan) {
                return sock.sendMessage(chatId, { text: "❌ No se pudo identificar al usuario." });
            }

            // Ejecutar ban
            await sock.groupParticipantsUpdate(chatId, [userToBan], 'remove');
            await sock.sendMessage(chatId, { 
                text: `✅ @${userToBan.split('@')[0]} ha sido expulsado del grupo.`,
                mentions: [userToBan]
            });
        } catch (e) {
            console.error('Error en comando ban:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al expulsar al usuario." });
        }
    }
};