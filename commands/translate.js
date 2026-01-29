const axios = require('axios');
module.exports = {
    name: 'trt',
    alias: ['translate'],
    async execute(sock, chatId, m, { args }) {
        if (args.length < 2) return sock.sendMessage(chatId, { text: "Uso: .trt en Hola" });
        const lang = args[0];
        const msg = args.slice(1).join(" ");
        try {
            const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(msg)}`);
            await sock.sendMessage(chatId, { text: `*Traducción:* ${res.data[0][0][0]}` });
        } catch { await sock.sendMessage(chatId, { text: "Error de traducción." }); }
    }
};