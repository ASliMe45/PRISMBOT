let giveawayCache = {};

module.exports = {
    name: 'giveaway',
    alias: ['sorteo'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        if (!senderIsOwner) return;
        const action = args[0];

        if (action === 'start') {
            const prize = args.slice(1).join(" ");
            if (!prize) return sock.sendMessage(chatId, { text: "Uso: .giveaway start <premio>" });
            giveawayCache[chatId] = { prize, status: 'active' };
            await sock.sendMessage(chatId, { text: `🎉 *SORTEO INICIADO*\n🎁 Premio: ${prize}` });
        } else if (action === 'end') {
            if (!giveawayCache[chatId]) return sock.sendMessage(chatId, { text: "No hay sorteo activo." });
            const metadata = await sock.groupMetadata(chatId);
            const winner = metadata.participants[Math.floor(Math.random() * metadata.participants.length)];
            await sock.sendMessage(chatId, { 
                text: `🎊 *GANADOR:* @${winner.id.split('@')[0]}\n🎁 Premio: ${giveawayCache[chatId].prize}`,
                mentions: [winner.id]
            });
            delete giveawayCache[chatId];
        }
    }
};
