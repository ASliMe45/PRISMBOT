/**
 * BOT STATISTICS MANAGER
 * Records executed commands and groups where the bot is used
 */

// ===== IMPORTS =====
const fs = require('fs');
const path = './data/stats.json';

module.exports = {
    /**
     * Records an executed command
     * Increments the counter and saves the group if necessary
     * 
     * @param {string} chatId - ID of the chat where the command was executed
     * @param {boolean} isGroup - Is it a group or private chat?
     */
    register: (chatId, isGroup) => {
        // Create data folder if it doesn't exist
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        
        // Get existing data or create new
        let data = fs.existsSync(path) 
            ? JSON.parse(fs.readFileSync(path)) 
            : { commands: 0, groups: [] };
        
        // Increment command counter
        data.commands++;
        
        // Add group to list if not already there
        if (isGroup && !data.groups.includes(chatId)) {
            data.groups.push(chatId);
        }
        
        // Save data
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
    },
    
    /**
     * Gets current statistics
     * @returns {object} Object with executed commands and group list
     */
    get: () => fs.existsSync(path) 
        ? JSON.parse(fs.readFileSync(path)) 
        : { commands: 0, groups: [] }
};