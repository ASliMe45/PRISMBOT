/**
 * COMMAND: SIMAGE/TOIMG
 * Converts stickers into PNG images
 */

// ===== IMPORTS =====
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');

module.exports = {
    name: 'simage',
    alias: ['toimg'],
    async execute(sock, chatId, m) {
        try {
            // Get the replied sticker
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.stickerMessage) {
                return sock.sendMessage(chatId, { text: '❌ You need to reply to a sticker.' });
            }

            // Download the sticker
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            
            // Create temp folder if it doesn't exist
            if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
            
            // Convert to PNG
            const output = `./temp/conv_${Date.now()}.png`;
            await sharp(buffer).toFormat('png').toFile(output);
            
            // Send image
            await sock.sendMessage(chatId, { 
                image: fs.readFileSync(output), 
                caption: "✅ Sticker converted to image." 
            }, { quoted: m });
            
            // Delete temporary file
            fs.unlinkSync(output);
        } catch (e) {
            console.error('Error in simage command:', e);
            await sock.sendMessage(chatId, { text: '❌ Error converting the sticker.' });
        }
    }
};