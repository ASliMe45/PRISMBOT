/**
 * COMMAND: STATUS/INFO/BOTSTAT
 * Shows the current bot status (uptime, RAM, version, etc.)
 */

// ===== IMPORTS =====
const os = require('os');
const stats = require('../lib/stats');

module.exports = {
    name: 'status',
    alias: ['info', 'botstat'],
    async execute(sock, chatId, m, { settings }) {
        // Get statistics
        const dataStats = stats.get();
        const uptime = process.uptime();
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        // Build status message
        const statusText = `
🤖 *BOT STATUS ${settings.botName}*

🚀 Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
💾 RAM: ${ram} MB
📊 Commands: ${dataStats.commands || 0}
👥 Groups: ${dataStats.groups?.length || 0}
📡 Version: ${settings.version}
`.trim();

        // Send status
        await sock.sendMessage(chatId, { text: statusText }, { quoted: m });
    }
};