/**
 * COMANDO: MUTE
 * Silencia el grupo permitiendo solo que admins envíen mensajes
 */

module.exports = {
    name: 'mute',
    alias: ['silencio'],
    async execute(sock, chatId, m, { args, isSenderAdmin, isBotAdmin }) {
        try {
            // Verificar permisos
            if (!isSenderAdmin) {
                return sock.sendMessage(chatId, { text: "❌ Necesitas ser admin del grupo." });
            }
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, { text: "❌ Necesito ser admin del grupo." });
            }

            // Obtener tiempo (en minutos)
            const time = parseInt(args[0]) || 60; // 60 minutos por defecto
            
            // Silenciar grupo (solo admins pueden hablar)
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, { text: `🔇 *Grupo silenciado* por ${time} minutos. Solo los admins pueden enviar mensajes.` });

            // Programar desmuteado automático
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: "🔊 *Grupo abierto.* Todos pueden enviar mensajes nuevamente." });
                } catch (e) {
                    console.error('Error al desmutear:', e);
                }
            }, time * 60000);
        } catch (e) {
            console.error('Error en comando mute:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al silenciar el grupo." });
        }
    }
};