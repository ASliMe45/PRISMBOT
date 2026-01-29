module.exports = async (sock, chatId, senderId) => {
    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        const sender = participants.find(p => p.id === senderId);
        const bot = participants.find(p => p.id === botId || p.id === sock.user.id);

        return {
            isSenderAdmin: sender?.admin?.includes('admin') || false,
            isBotAdmin: bot?.admin?.includes('admin') || false
        };
    } catch {
        return { isSenderAdmin: false, isBotAdmin: false };
    }
};