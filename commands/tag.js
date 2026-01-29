/**
 * COMANDO: TAGALL/TODOS/TAG
 * Menciona a todos los miembros del grupo con un mensaje
 */

module.exports = {
    name: 'tagall',
    alias: ['todos', 'tag'],
    async execute(sock, chatId, m, { text, isSenderAdmin, isBotAdmin }) {
        try {
            // Verificar permisos
            if (!isSenderAdmin) {
                return sock.sendMessage(chatId, { text: "❌ Necesitas ser admin del grupo para usar este comando." });
            }
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, { text: "❌ Necesito ser admin del grupo para mencionar a todos." });
            }

            // Obtener metadata del grupo
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants;
            let mentions = participants.map(p => p.id);
            
            // Construir mensaje
            let message = `📢 *MENSAJE DEL ADMIN*\n━━━━━━━━━━━━━━━━\n\n${text || 'Mensaje importante para el grupo'}\n\n━━━━━━━━━━━━━━━━\n\n`;
            participants.forEach(p => message += `◦ @${p.id.split('@')[0]}\n`);
            
            // Enviar mensaje con menciones
            await sock.sendMessage(chatId, { text: message, mentions }, { quoted: m });
        } catch (e) {
            console.error('Error en comando tagall:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al mencionar a todos los miembros." });
        }
    }
};