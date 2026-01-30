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
    async execute(sock, chatId, m, { settings, t }) {
        // Get statistics
        const dataStats = stats.get();
        const uptime = process.uptime();
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        // Build status message
        const statusText = `
🤖 *${t('commands.status.title').toUpperCase()} ${settings.botName}*

🚀 ${t('commands.status.uptime')}: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
💾 ${t('commands.status.ram')}: ${ram} MB
📊 ${t('commands.status.commands')}: ${dataStats.commands || 0}
👥 ${t('commands.status.groups')}: ${dataStats.groups?.length || 0}
📡 ${t('commands.status.version')}: ${settings.version}
`.trim();

        // Send status
        await sock.sendMessage(chatId, { text: statusText }, { quoted: m });
    }
};