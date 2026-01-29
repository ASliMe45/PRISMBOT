/**
 * COMMAND: MUTE
 * Silences the group allowing only admins to send messages
 */

module.exports = {
    name: 'mute',
    alias: ['silence'],
    async execute(sock, chatId, m, { args, isSenderAdmin, isBotAdmin }) {
        try {
            // Check permissions
            if (!isSenderAdmin) {
                return sock.sendMessage(chatId, { text: "❌ You need to be a group admin." });
            }
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, { text: "❌ I need to be a group admin." });
            }

            // Get time (in minutes)
            const time = parseInt(args[0]) || 60; // 60 minutes by default
            
            // Mute group (only admins can speak)
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, { text: `🔇 *Group muted* for ${time} minutes. Only admins can send messages.` });

            // Schedule auto-unmute
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: "🔊 *Group opened.* Everyone can send messages again." });
                } catch (e) {
                    console.error('Error unmuting:', e);
                }
            }, time * 60000);
        } catch (e) {
            console.error('Error in mute command:', e);
            await sock.sendMessage(chatId, { text: "❌ Error muting the group." });
        }
    }
};