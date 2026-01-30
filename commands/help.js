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
*${settings.botName} MENU*

*MULTIMEDIA:*
.s / .sticker 
.simage

*TOOLS:*
.trt <language> <text>
.tts <text>
.report <reason>

*GROUPS:*
.ban / .kick
.mute <minutes>
.tagall
.welcome <on/off/set>
.goodbye <on/off/set>
.giveaway <start/end>

*SYSTEM / ONLY OWNER:*
.status
.update
.reset

`.trim();

        // Send the menu
        await sock.sendMessage(chatId, { text: menu }, { quoted: m });
    }
};