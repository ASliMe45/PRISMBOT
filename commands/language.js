/**
 * COMMAND: LANGUAGE/IDIOMA/LANG
 * Changes the bot's language for the group (ES/EN)
 */

// ===== IMPORTS =====
const { setLanguage, getLanguage } = require('../lib/index');
const { t, isValidLanguage } = require('../translations');

module.exports = {
    name: 'language',
    alias: ['idioma', 'lang'],
    async execute(sock, chatId, m, { args, t: translate }) {
        try {
            // Get current language
            const currentLang = getLanguage(chatId);
            
            // If no arguments, show current language
            if (!args[0]) {
                return sock.sendMessage(chatId, { 
                    text: `${translate('commands.language.current')}: ${currentLang.toUpperCase()}\n\n${translate('commands.language.usage')}`
                }, { quoted: m });
            }

            // Get requested language
            const requestedLang = args[0].toLowerCase();

            // Validate language
            if (!isValidLanguage(requestedLang)) {
                return sock.sendMessage(chatId, { 
                    text: translate('commands.language.invalid')
                }, { quoted: m });
            }

            // Same language check
            if (currentLang === requestedLang) {
                return sock.sendMessage(chatId, { 
                    text: `${translate('commands.language.current')}: ${requestedLang.toUpperCase()}`
                }, { quoted: m });
            }

            // Save new language
            setLanguage(chatId, requestedLang);

            // Confirm change
            const langNames = { 'es': 'Español', 'en': 'English' };
            await sock.sendMessage(chatId, { 
                text: `${translate('commands.language.changed')} ${langNames[requestedLang]} ✅`
            }, { quoted: m });

        } catch (e) {
            console.error('Error in language command:', e);
            await sock.sendMessage(chatId, { text: translate('common.error') });
        }
    }
};
