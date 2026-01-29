/**
 * COMANDO: STICKER/S
 * Convierte imágenes y videos en stickers de WhatsApp
 */

// ===== IMPORTACIONES =====
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
    name: 'sticker',
    alias: ['s'],
    async execute(sock, chatId, m) {
        try {
            // Obtener el archivo multimedia (imagen o video)
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            if (!quoted.imageMessage && !quoted.videoMessage) {
                return sock.sendMessage(chatId, { text: "❌ Responde a una imagen o video para convertir a sticker." });
            }

            // Descargar el archivo
            const buffer = await downloadMediaMessage(m, 'buffer', {});
            
            // Enviar como sticker
            await sock.sendMessage(chatId, { sticker: buffer }, { quoted: m });
        } catch (e) {
            console.error('Error en comando sticker:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al convertir a sticker." });
        }
    }
};