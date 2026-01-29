/**
 * COMMAND: MUTE
 * Silences the group allowing only admins to send messages
 */

module.exports = {
    name: 'mute',
    alias: ['silence'],
    async execute(sock, chatId, m, { args, isSenderAdmin, isBotAdmin, t }) {
        try {
            // Check permissions
            if (!isSenderAdmin) {
                return sock.sendMessage(chatId, { text: t('commands.mute.adminOnly') });
            }
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, { text: t('commands.mute.botNoAdmin') });
            }

            // Get time (in minutes)
            const time = parseInt(args[0]) || 60; // 60 minutes by default
            
            // Mute group (only admins can speak)
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, { text: t('commands.mute.muted', { time }) });

            // Schedule auto-unmute
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: t('commands.mute.unmuted') });
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