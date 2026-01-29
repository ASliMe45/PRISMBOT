/**
 * COMANDO: TTS/DECIR/VOICE
 * Convierte texto a audio usando síntesis de voz de Google
 */

module.exports = {
    name: 'tts',
    alias: ['decir', 'voice', 'hablar'],
    async execute(sock, chatId, m, { text }) {
        try {
            // Validar que haya texto
            if (!text) {
                return sock.sendMessage(chatId, { text: "❌ Uso: .tts <texto a convertir>\n\nEj: .tts Hola mundo" });
            }
            
            // Generar URL de audio (Google Translate TTS)
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;
            
            // Enviar audio como mensaje de voz
            await sock.sendMessage(chatId, { 
                audio: { url: ttsUrl }, 
                mimetype: 'audio/mp4', 
                ptt: true  // PTT = Push To Talk (mensaje de voz)
            }, { quoted: m });
        } catch (e) {
            console.error('Error en comando tts:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al generar el audio." });
        }
    }
};