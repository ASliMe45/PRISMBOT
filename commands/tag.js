module.exports = {
    name: 'tagall',
    alias: ['todos', 'tag'],
    async execute(sock, chatId, m, { text }) {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants;
        let mentions = participants.map(p => p.id);
        let message = `📢 *MENSAJE:* ${text || 'Sin mensaje'}\n\n`;
        participants.forEach(p => message += `◦ @${p.id.split('@')[0]}\n`);
        
        await sock.sendMessage(chatId, { text: message, mentions }, { quoted: m });
    }
};