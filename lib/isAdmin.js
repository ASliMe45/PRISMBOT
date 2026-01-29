/**
 * ADMIN PERMISSION CHECKER
 * Validates if a user or the bot are administrators of the group
 */

/**
 * Checks if a user and the bot are administrators
 * 
 * @param {object} sock - Baileys socket
 * @param {string} chatId - Group ID
 * @param {string} senderId - ID of user to verify
 * @returns {object} Object with isSenderAdmin and isBotAdmin properties
 */
module.exports = async (sock, chatId, senderId) => {
    try {
        // Get group metadata
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        // Get bot ID
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Find the user in participants
        const sender = participants.find(p => p.id === senderId);
        
        // Find the bot in participants
        const bot = participants.find(p => p.id === botId || p.id === sock.user.id);

        // Return if both are administrators
        return {
            isSenderAdmin: sender?.admin?.includes('admin') || false,
            isBotAdmin: bot?.admin?.includes('admin') || false
        };
    } catch (error) {
        // On error, return false for both
        console.error('Error checking admin:', error.message);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
};