/**
 * COMMAND: MUTE
 * Silences the group allowing only admins to send messages
 */

module.exports = {
    name: 'mute',
    alias: ['silence'],
    async execute(sock, chatId, m, { args, isSenderAdmin }) {
        try {
            if (!chatId.endsWith('@g.us')) {
                return sock.sendMessage(chatId, { text: "This command can only be used in groups." });
            }
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = participants.find(p => p.id === botNumber);
            const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

            if (!isSenderAdmin) {
                return sock.sendMessage(chatId, { text: '❌ Only admins can mute.' });
            }
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, { text: '❌ I need to be admin to mute.' });
            }
            const time = parseInt(args[0]) || 60; 
            
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, { text: `🔇 *Group muted for ${time} minutes.* Only admins can send messages.` });

            setTimeout(async () => {
                try {
                    const freshMeta = await sock.groupMetadata(chatId);
                    const stillAdmin = freshMeta.participants.find(p => p.id === botNumber)?.admin;
                    
                    if (stillAdmin) {
                        await sock.groupSettingUpdate(chatId, 'not_announcement');
                        await sock.sendMessage(chatId, { text: '🔊 *Group opened.* Everyone can send messages again.' });
                    }
                } catch (e) {
                    console.error('Error during automatic unmute:', e);
                }
            }, time * 60000);

        } catch (e) {
            console.error('Error in mute command:', e);
            await sock.sendMessage(chatId, { text: "❌ *Error: Failed to mute the group*." });
        }
    }
};

