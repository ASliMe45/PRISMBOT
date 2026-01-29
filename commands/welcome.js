const { addWelcome, delWelcome } = require('../lib/index');

module.exports = {
    name: 'welcome',
    alias: ['bienvenida'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        if (!senderIsOwner) return;
        const action = args[0]?.toLowerCase();
        const content = args.slice(1).join(' ');

        if (action === 'on') {
            await addWelcome(chatId, true);
            await sock.sendMessage(chatId, { text: "✅ Bienvenidas activadas." });
        } else if (action === 'off') {
            await delWelcome(chatId);
            await sock.sendMessage(chatId, { text: "🚫 Bienvenidas desactivadas." });
        } else if (action === 'set') {
            if (!content) return sock.sendMessage(chatId, { text: "❌ Uso: .welcome set Bienvenido {user} a {group}" });
            await addWelcome(chatId, true, content);
            await sock.sendMessage(chatId, { text: "✅ Mensaje de bienvenida guardado." });
        }
    }
};