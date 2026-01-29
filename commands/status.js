/**
 * COMANDO: STATUS/INFO/BOTSTAT
 * Muestra el estado actual del bot (uptime, RAM, versión, etc.)
 */

// ===== IMPORTACIONES =====
const os = require('os');
const stats = require('../lib/stats');

module.exports = {
    name: 'status',
    alias: ['info', 'botstat'],
    async execute(sock, chatId, m, { settings }) {
        // Obtener estadísticas
        const dataStats = stats.get();
        const uptime = process.uptime();
        const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

        // Construir mensaje de estado
        const statusText = `
🤖 *ESTADO DE ${settings.botName}*
━━━━━━━━━━━━━━━━
🚀 Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
💾 RAM: ${ram} MB
📊 Comandos: ${dataStats.commands || 0}
👥 Grupos: ${dataStats.groups?.length || 0}
📡 Versión: ${settings.version}
━━━━━━━━━━━━━━━━
`.trim();

        // Enviar estado
        await sock.sendMessage(chatId, { text: statusText }, { quoted: m });
    }
};