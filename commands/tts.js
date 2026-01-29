module.exports = {
    name: 'tts',
    alias: ['decir', 'voice'],
    async execute(sock, chatId, m, { text }) {
        if (!text) return sock.sendMessage(chatId, { text: "❌ Escribe el texto a convertir." });
        try {
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;
            await sock.sendMessage(chatId, { 
                audio: { url: ttsUrl }, 
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: m });
        } catch (e) {
            await sock.sendMessage(chatId, { text: "❌ Error al generar audio." });
        }
    }
};