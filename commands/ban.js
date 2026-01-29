module.exports = async (sock, chatId, m, user) => {
    if (!user) return sock.sendMessage(chatId, { text: "❌ Tag a user or type their number." });
    
    await sock.groupParticipantsUpdate(chatId, [user], 'remove');
    await sock.sendMessage(chatId, { text: `✅ User @${user.split('@')[0]} has been removed from the group.`, mentions: [user] });
};