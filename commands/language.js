/**
 * COMMAND: LANGUAGE (REMOVED)
 * This command has been removed. The bot now only runs in English.
 */

// This command is disabled - bot is English-only
module.exports = {
    name: 'language',
    alias: ['idioma', 'lang'],
    async execute(sock, chatId, m) {
        await sock.sendMessage(chatId, { 
            text: '❌ Language selection has been disabled. This bot runs in English only.' 
        }, { quoted: m });
    }
};
