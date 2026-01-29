/**
 * COMMAND: TAGALL/EVERYONE/TAG
 * Mentions all group members with a message
 */

module.exports = {
    name: 'tagall',
    alias: ['everyone', 'tag'],
    async execute(sock, chatId, m, { text, isSenderAdmin, isBotAdmin }) {
        try {
            // Check permissions
            if (!isSenderAdmin) {
                return sock.sendMessage(chatId, { text: "❌ You need to be a group admin to use this command." });
            }
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, { text: "❌ I need to be a group admin to mention everyone." });
            }

            // Get group metadata
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants;
            let mentions = participants.map(p => p.id);
            
            // Build message
            let message = `📢 *ADMIN MESSAGE*\n━━━━━━━━━━━━━━━━\n\n${text || 'Important message for the group'}\n\n━━━━━━━━━━━━━━━━\n\n`;
            participants.forEach(p => message += `◦ @${p.id.split('@')[0]}\n`);
            
            // Send message with mentions
            await sock.sendMessage(chatId, { text: message, mentions }, { quoted: m });
        } catch (e) {
            console.error('Error in tagall command:', e);
            await sock.sendMessage(chatId, { text: "❌ Error mentioning all members." });
        }
    }
};