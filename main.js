/**
 * MESSAGE PROCESSOR
 * Receives incoming messages and executes corresponding commands
 */

// ===== IMPORTS =====
const settings = require('./settings');
const loader = require('./lib/loader');
const isAdmin = require('./lib/isAdmin');
const stats = require('./lib/stats');
const { getLanguage } = require('./lib/index');
const { t } = require('./translations');

/**
 * Handles incoming messages
 * Extracts commands, parameters and executes the corresponding command
 * 
 * @param {object} sock - Baileys connection socket
 * @param {object} chatUpdate - Chat update object
 */
async function handleMessages(sock, chatUpdate) {
    try {
        // Get the message
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;

        // ===== MESSAGE DATA EXTRACTION =====
        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
        
        // Check if message starts with command prefix
        if (!body.startsWith(settings.prefix)) return;

        // ===== COMMAND PARSING =====
        const commandName = body.slice(settings.prefix.length).trim().split(/\s+/)[0].toLowerCase();
        const args = body.trim().split(/\s+/).slice(1);
        const text = args.join(" ");
        
        // ===== PERMISSIONS VERIFICATION =====
        const senderIsOwner = senderId.includes(settings.ownerNumber);
        const { isSenderAdmin, isBotAdmin } = chatId.endsWith('@g.us') 
            ? await isAdmin(sock, chatId, senderId) 
            : { isSenderAdmin: false, isBotAdmin: false };

        // ===== COMMAND SEARCH AND EXECUTION =====
        const commands = loader.getCommands();
        const cmd = commands.get(commandName) || [...commands.values()].find(c => c.alias?.includes(commandName));

        if (cmd) {
            // Register command execution in statistics
            stats.register(chatId, chatId.endsWith('@g.us'));
            
            // Get group language
            const lang = getLanguage(chatId);
            
            // Create translation function for this group
            const translate = (key, defaultValue) => t(lang, key, defaultValue);
            
            await cmd.execute(sock, chatId, m, { 
                args,                           // Command arguments
                text,                           // Command text
                senderId,                       // ID of who sent the message
                senderIsOwner,                  // Is the owner?
                isSenderAdmin,                  // Is group admin?
                isBotAdmin,                     // Is the bot admin?
                commandName,                    // Name of executed command
                settings,                       // Bot configuration
                t: translate                    // Translation function
            });
        }
    } catch (e) { 
        console.error('Error processing message:', e); 
    }
}

module.exports = { handleMessages };