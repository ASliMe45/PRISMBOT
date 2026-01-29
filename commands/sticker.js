const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
    name: 'sticker',
    alias: ['s'],
    async execute(sock, chatId, m) {
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
        if (!quoted.imageMessage && !quoted.videoMessage) return sock.sendMessage(chatId, { text: "Responde a una imagen o video." });

        const buffer = await downloadMediaMessage(m, 'buffer', {});
        const tmpFile = `./data/tmp_${Date.now()}.webp`;
        
        // Simulación de conversión rápida (necesitas ffmpeg instalado en el sistema)
        fs.writeFileSync(tmpFile, buffer); 
        await sock.sendMessage(chatId, { sticker: buffer }); // Enviar buffer directo si ya es compatible
        fs.unlinkSync(tmpFile);
    }
};