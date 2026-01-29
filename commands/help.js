/**
 * COMMAND: HELP/MENU
 * Shows the help menu with all available commands
 */

module.exports = {
    name: 'help',
    alias: ['menu'],
    async execute(sock, chatId, m, { settings }) {
        // Build help menu
        const menu = `
╭──『 *${settings.botName}* 』──╮
│
┝─『 *MULTIMEDIA* 』
│ .s / .sticker ➜ Convert to sticker
│ .simage ➜ Convert to image
│
┝─『 *TOOLS* 』
│ .trt <language> <text> ➜ Translate text
│ .tts <text> ➜ Convert to audio
│ .report <reason> ➜ Report to owner
│
┝─『 *GROUPS* 』
│ .ban / .kick ➜ Ban user
│ .mute <minutes> ➜ Mute user
│ .tagall ➜ Mention everyone
│ .welcome <on/off/set> ➜ Automatic greetings
│ .goodbye <on/off/set> ➜ Automatic farewells
│ .giveaway <start/end> ➜ Create giveaways
│
┝─『 *SYSTEM* 』
│ .status ➜ View bot status
│ .update ➜ Update bot
│ .reset ➜ Restart bot
╰──────────────────╯`.trim();

        // Send the menu
        await sock.sendMessage(chatId, { text: menu }, { quoted: m });
    }
};