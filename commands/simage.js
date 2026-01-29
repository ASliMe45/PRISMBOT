const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');

module.exports = {
    name: 'simage',
    alias: ['toimg'],
    async execute(sock, chatId, m) {
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.stickerMessage) return sock.sendMessage(chatId, { text: "Responde a un sticker." });

        const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
        const output = `./temp/conv_${Date.now()}.png`;
        
        await sharp(buffer).toFormat('png').toFile(output);
        await sock.sendMessage(chatId, { image: fs.readFileSync(output), caption: "✅ Sticker convertido a imagen." });
        fs.unlinkSync(output);
    }
};