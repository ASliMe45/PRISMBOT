/**
 * COMANDO: SIMAGE/TOIMG
 * Convierte stickers en imágenes PNG
 */

// ===== IMPORTACIONES =====
const sharp = require('sharp');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');

module.exports = {
    name: 'simage',
    alias: ['toimg'],
    async execute(sock, chatId, m) {
        try {
            // Obtener el sticker respondido
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted?.stickerMessage) {
                return sock.sendMessage(chatId, { text: "❌ Responde a un sticker para convertir a imagen." });
            }

            // Descargar el sticker
            const buffer = await downloadMediaMessage({ message: quoted }, 'buffer', {});
            
            // Crear carpeta temporal si no existe
            if (!fs.existsSync('./temp')) fs.mkdirSync('./temp');
            
            // Convertir a PNG
            const output = `./temp/conv_${Date.now()}.png`;
            await sharp(buffer).toFormat('png').toFile(output);
            
            // Enviar imagen
            await sock.sendMessage(chatId, { 
                image: fs.readFileSync(output), 
                caption: "✅ Sticker convertido a imagen." 
            }, { quoted: m });
            
            // Eliminar archivo temporal
            fs.unlinkSync(output);
        } catch (e) {
            console.error('Error en comando simage:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al convertir el sticker." });
        }
    }
};