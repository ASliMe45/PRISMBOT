/**
 * COMANDO: SUDO
 * Gestiona administradores secundarios (sudos) que pueden ejecutar comandos del bot
 */

// ===== IMPORTACIONES =====
const { addSudo, delSudo, isSudo, getSudos } = require('../lib/index');
const fs = require('fs');

module.exports = {
    name: 'sudo',
    alias: ['owner', 'superuser'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        // Solo el Owner principal puede gestionar sudos
        if (!senderIsOwner) return;

        const action = args[0]?.toLowerCase();
        
        // ===== OBTENER USUARIO =====
        // Puede ser por mención, respuesta a un mensaje o número directo
        let user;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            user = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            user = m.message.extendedTextMessage.contextInfo.participant;
        } else if (args[1]) {
            user = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        // ===== PROCESAMIENTO DE ACCIONES =====
        switch (action) {
            case 'add':
                // Añadir un nuevo sudo
                if (!user) {
                    return sock.sendMessage(chatId, { 
                        text: "❌ Uso incorrecto\\n\\nOpciones:\\n1. Menciona: .sudo add @usuario\\n2. Responde: .sudo add (en respuesta)\\n3. Número: .sudo add 1234567890" 
                    });
                }
                await addSudo(user);
                await sock.sendMessage(chatId, { 
                    text: `✅ @${user.split('@')[0]} ahora es un **SUDO** con permisos totales.`,
                    mentions: [user] 
                }, { quoted: m });
                break;

            case 'del':
            case 'remove':
                // Eliminar un sudo
                if (!user) {
                    return sock.sendMessage(chatId, { text: "❌ Menciona a alguien para quitarle el sudo." });
                }
                await delSudo(user);
                await sock.sendMessage(chatId, { 
                    text: `🗑️ @${user.split('@')[0]} ha sido eliminado de la lista de SUDOS.`,
                    mentions: [user] 
                }, { quoted: m });
                break;

            case 'list':
                // Listar todos los sudos
                const sudos = getSudos();
                
                if (sudos.length === 0) {
                    return sock.sendMessage(chatId, { text: "📂 No hay SUDOS registrados aparte del Owner principal." });
                }
                
                let list = "⭐ *LISTA DE SUDOS ACTUALES*\n━━━━━━━━━━━━━━━━\n\n";
                sudos.forEach((s, i) => {
                    list += `${i + 1}. @${s.split('@')[0]}\\n`;
                });
                
                await sock.sendMessage(chatId, { text: list, mentions: sudos }, { quoted: m });
                break;

            default:
                // Mostrar ayuda
                await sock.sendMessage(chatId, { 
                    text: "⌨️ *GESTIÓN DE SUDOS*\n\n.sudo add <@tag> ➜ Añadir sudo\\n.sudo del <@tag> ➜ Eliminar sudo\\n.sudo list ➜ Listar sudos" 
                });
                break;
        }
    }
};