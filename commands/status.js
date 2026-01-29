const os = require('os');
const stats = require('../lib/stats');

module.exports = {
    name: 'status',
    alias: ['info', 'botstat'],
    async execute(sock, chatId, m, { settings }) {
        const dataStats = stats.get();
        const uptime = process.uptime();
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        const statusText = `
🤖 *ESTADO DE ${settings.botName}*
🚀 Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
💾 RAM: ${ram} MB
📊 Comandos: ${dataStats.commands || 0}
👥 Grupos: ${dataStats.groups?.length || 0}
📡 Versión: ${settings.version}
`.trim();

        await sock.sendMessage(chatId, { text: statusText }, { quoted: m });
    }
};