/**
 * COMMAND: BAN/KICK
 * Removes a member from the group
 */

module.exports = {
    name: 'ban',
    alias: ['kick', 'remove'],
    async execute(sock, chatId, m, { isSenderAdmin, isBotAdmin }) {
        try {
            // Check permissions
            if (!isSenderAdmin) {
                return sock.sendMessage(chatId, { text: "❌ You need to be a group admin to use this command." });
            }
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, { text: "❌ I need to be a group admin." });
            }

            // Get user to ban
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return sock.sendMessage(chatId, { text: "❌ Reply to the user's message that you want to remove." });
            }

            // Get user ID
            const userToBan = m.message.extendedTextMessage?.contextInfo?.participant;
            if (!userToBan) {
                return sock.sendMessage(chatId, { text: "❌ Could not identify the user." });
            }

            // Execute ban
            await sock.groupParticipantsUpdate(chatId, [userToBan], 'remove');
            await sock.sendMessage(chatId, { 
                text: `✅ @${userToBan.split('@')[0]} has been removed from the group.`,
                mentions: [userToBan]
            });
        } catch (e) {
            console.error('Error in ban command:', e);
            await sock.sendMessage(chatId, { text: "❌ Error removing the user." });
        }
    }
};