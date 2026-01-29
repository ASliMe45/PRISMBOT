/**
 * COMMAND: TRT/TRANSLATE
 * Translates texts into different languages using Google Translate
 */

// ===== IMPORTS =====
const axios = require('axios');

module.exports = {
    name: 'trt',
    alias: ['translate', 'trans'],
    async execute(sock, chatId, m, { args }) {
        try {
            // Validate arguments
            if (args.length < 2) {
                return sock.sendMessage(chatId, { 
                    text: "❌ Usage: .trt <language> <text>\n\nExamples:\n.trt en Hello\n.trt es Hola\n.trt fr Bonjour" 
                });
            }
            
            // Get language and text
            const lang = args[0].toLowerCase();
            const msg = args.slice(1).join(" ");
            
            // Translate using Google Translate API
            const res = await axios.get(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(msg)}`
            );
            
            const translation = res.data[0][0][0];
            
            // Send result
            await sock.sendMessage(chatId, { 
                text: `🌐 *TRANSLATION*\n\n📝 Original: ${msg}\n🔤 Language: ${lang}\n✅ Translated: ${translation}` 
            }, { quoted: m });
        } catch (e) {
            console.error('Error in translate command:', e);
            await sock.sendMessage(chatId, { text: "❌ Error translating the text." });
        }
    }
};