const { addGoodbye, delGoodBye } = require('../lib/index');

module.exports = {
    name: 'goodbye',
    alias: ['adios'],
    async execute(sock, chatId, m, { args, senderIsOwner }) {
        if (!senderIsOwner) return;
        const action = args[0];
        if (action === 'on') {
            await addGoodbye(chatId, true);
            await sock.sendMessage(chatId, { text: "✅ Despedidas activadas." });
        } else if (action === 'off') {
            await delGoodBye(chatId);
            await sock.sendMessage(chatId, { text: "🚫 Despedidas desactivadas." });
        }
    }
};
