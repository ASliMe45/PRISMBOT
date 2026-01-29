/**
 * COMMAND: SUDO
 * Manages secondary admins (sudos) who can execute bot commands
 */

// ===== IMPORTS =====
const { addSudo, delSudo, isSudo, getSudos } = require('../lib/index');
const fs = require('fs');

module.exports = {
    name: 'sudo',
    alias: ['owner', 'superuser'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        // Only the main owner can manage sudos
        if (!senderIsOwner) return;

        const action = args[0]?.toLowerCase();
        
        // ===== GET USER =====
        // Can be by mention, reply to message or direct number
        let user;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            user = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            user = m.message.extendedTextMessage.contextInfo.participant;
        } else if (args[1]) {
            user = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        // ===== ACTION PROCESSING =====
        switch (action) {
            case 'add':
                // Add new sudo
                if (!user) {
                    return sock.sendMessage(chatId, { 
                        text: "❌ Incorrect usage\n\nOptions:\n1. Mention: .sudo add @user\n2. Reply: .sudo add (in reply)\n3. Number: .sudo add 1234567890" 
                    });
                }
                await addSudo(user);
                await sock.sendMessage(chatId, { 
                    text: `✅ @${user.split('@')[0]} is now a **SUDO** with full permissions.`,
                    mentions: [user] 
                }, { quoted: m });
                break;

            case 'del':
            case 'remove':
                // Remove a sudo
                if (!user) {
                    return sock.sendMessage(chatId, { text: "❌ Mention someone to remove their sudo status." });
                }
                await delSudo(user);
                await sock.sendMessage(chatId, { 
                    text: `🗑️ @${user.split('@')[0]} has been removed from the SUDO list.`,
                    mentions: [user] 
                }, { quoted: m });
                break;

            case 'list':
                // Listar todos los sudos
                const sudos = getSudos();
                
                if (sudos.length === 0) {
                    return sock.sendMessage(chatId, { text: "📂 No SUDOs registered besides the main owner." });
                }
                
                let list = "⭐ *CURRENT SUDO LIST*\n━━━━━━━━━━━━━━━━\n\n";
                sudos.forEach((s, i) => {
                    list += `${i + 1}. @${s.split('@')[0]}\\n`;
                });
                
                await sock.sendMessage(chatId, { text: list, mentions: sudos }, { quoted: m });
                break;

            default:
                // Mostrar ayuda
                await sock.sendMessage(chatId, { 
                    text: "⌨️ *SUDO MANAGEMENT*\n\n.sudo add <@tag> ➜ Add sudo\n.sudo del <@tag> ➜ Remove sudo\n.sudo list ➜ List sudos" 
                });
                break;
        }
    }
};