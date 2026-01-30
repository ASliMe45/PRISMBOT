/**
 * COMMAND: STICKER/S
 * Converts images and videos into WhatsApp stickers
 */

// ===== IMPORTS =====
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
    name: 'sticker',
    alias: ['s'],
    async execute(sock, chatId, m) {
        try {
            // Get multimedia file (image or video)
            const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
            if (!quoted.imageMessage && !quoted.videoMessage) {
                return sock.sendMessage(chatId, { text: '❌ You need to reply to an image or send one.' });
            }

            // Download the file
            const buffer = await downloadMediaMessage(m, 'buffer', {});
            
            // Send as sticker
            await sock.sendMessage(chatId, { sticker: buffer }, { quoted: m });
        } catch (e) {
            console.error('Error in sticker command:', e);
            await sock.sendMessage(chatId, { text: '❌ Error converting to sticker.' });
        }
    }
};