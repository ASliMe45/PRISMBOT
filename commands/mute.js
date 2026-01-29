/**
 * MUTE GROUP COMMAND
 */
module.exports = async (sock, chatId, senderId, m, minutes) => {
    const time = parseInt(minutes) || 60; // 60 min por defecto
    
    await sock.groupSettingUpdate(chatId, 'announcement'); // Solo admins
    await sock.sendMessage(chatId, { text: `🔇 *Group Muted* for ${time} minutes. Only admins can send messages.` });

    // Programar la apertura automática
    setTimeout(async () => {
        await sock.groupSettingUpdate(chatId, 'not_announcement'); // Todos
        await sock.sendMessage(chatId, { text: "🔊 *Group Unmuted.* Everyone can send messages now." });
    }, time * 60000);
};