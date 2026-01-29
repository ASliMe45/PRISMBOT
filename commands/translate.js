/**
 * COMANDO: TRT/TRANSLATE
 * Traduce textos a diferentes idiomas usando Google Translate
 */

// ===== IMPORTACIONES =====
const axios = require('axios');

module.exports = {
    name: 'trt',
    alias: ['translate', 'traducir'],
    async execute(sock, chatId, m, { args }) {
        try {
            // Validar argumentos
            if (args.length < 2) {
                return sock.sendMessage(chatId, { 
                    text: "❌ Uso: .trt <idioma> <texto>\n\nEjemplos:\n.trt en Hola\n.trt es Hello\n.trt fr Bonjour" 
                });
            }
            
            // Obtener idioma y texto
            const lang = args[0].toLowerCase();
            const msg = args.slice(1).join(" ");
            
            // Traducir usando Google Translate API
            const res = await axios.get(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(msg)}`
            );
            
            const translation = res.data[0][0][0];
            
            // Enviar resultado
            await sock.sendMessage(chatId, { 
                text: `🌐 *TRADUCCIÓN*\n\n📝 Original: ${msg}\n🔤 Idioma: ${lang}\n✅ Traducido: ${translation}` 
            }, { quoted: m });
        } catch (e) {
            console.error('Error en comando translate:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al traducir el texto." });
        }
    }
};