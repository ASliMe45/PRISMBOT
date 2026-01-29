const { addSudo, delSudo, isSudo } = require('../lib/index');

module.exports = {
    name: 'sudo',
    alias: ['owner', 'superuser'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        // Solo el Owner principal (el del settings.js) puede gestionar otros sudos
        if (!senderIsOwner) return;

        const action = args[0]?.toLowerCase();
        
        // Obtener el número del usuario (ya sea por mención, por respuesta a un mensaje o por texto directo)
        let user;
        if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            user = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
            user = m.message.extendedTextMessage.contextInfo.participant;
        } else if (args[1]) {
            user = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        switch (action) {
            case 'add':
                if (!user) return sock.sendMessage(chatId, { text: "❌ Menciona a alguien, responde a su mensaje o escribe su número.\nEj: `.sudo add @user`" });
                await addSudo(user);
                await sock.sendMessage(chatId, { 
                    text: `✅ @${user.split('@')[0]} ahora es un **Sudo** y tiene acceso total.`,
                    mentions: [user] 
                }, { quoted: m });
                break;

            case 'del':
            case 'remove':
                if (!user) return sock.sendMessage(chatId, { text: "❌ Menciona a alguien para quitarle el sudo." });
                await delSudo(user);
                await sock.sendMessage(chatId, { 
                    text: `🗑️ @${user.split('@')[0]} ha sido eliminado de la lista de Sudos.`,
                    mentions: [user] 
                }, { quoted: m });
                break;

            case 'list':
                const { getSudos } = require('../lib/index'); // Asegúrate de tener esta pequeña función en tu lib
                const data = JSON.parse(require('fs').readFileSync('./data/settings.json'));
                const sudos = data.sudos || [];
                
                if (sudos.length === 0) return sock.sendMessage(chatId, { text: "📂 No hay Sudos registrados aparte del Owner." });
                
                let list = "⭐ *LISTA DE SUDOS ACTUALES*\n\n";
                sudos.forEach((s, i) => {
                    list += `${i + 1}. @${s.split('@')[0]}\n`;
                });
                
                await sock.sendMessage(chatId, { text: list, mentions: sudos }, { quoted: m });
                break;

            default:
                await sock.sendMessage(chatId, { 
                    text: "⌨️ *GESTIÓN DE SUDOS*\n\n.sudo add <@tag/reply>\n.sudo del <@tag/reply>\n.sudo list" 
                });
                break;
        }
    }
};