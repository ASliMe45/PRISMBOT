module.exports = {
    name: 'help',
    alias: ['menu'],
    async execute(sock, chatId, m, { settings }) {
        const menu = `
╭──『 *${settings.botName}* 』──╮
│
┝─『 *MULTIMEDIA* 』
│ .s / .sticker
│ .simage (convertir a img)
│
┝─『 *HERRAMIENTAS* 』
│ .trt <lang> <text>
│ .tts <text>
│ .report <text>
│
┝─『 *GRUPOS* 』
│ .ban / .kick
│ .mute <minutos>
│ .tagall / .todos
│ .welcome <on/off/set>
│ .goodbye <on/off/set>
│ .giveaway <start/end>
│
┝─『 *SISTEMA* 』
│ .status
│ .update
│ .reset
╰──────────────────╯`.trim();

        await sock.sendMessage(chatId, { text: menu }, { quoted: m });
    }
};