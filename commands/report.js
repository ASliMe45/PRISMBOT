/**
 * COMMAND: REPORT/REPORT_ISSUE
 * Allows users to report issues to the owner
 */

// ===== IMPORTS =====
const fs = require('fs');
const path = './data/reports.json';

module.exports = {
    name: 'report',
    alias: ['reportissue'],
    async execute(sock, chatId, m, { text, senderId, senderIsOwner, args, t }) {
        // Create folder and file if they don't exist
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));

        // ===== LIST REPORTS (Owner only) =====
        if (args[0] === 'list' && senderIsOwner) {
            const reports = JSON.parse(fs.readFileSync(path));
            
            if (reports.length === 0) {
                return sock.sendMessage(chatId, { text: t('commands.report.noReports') });
            }
            
            let txt = t('commands.report.activeReports') + "\n━━━━━━━━━━━━━━━━\n\n";
            reports.forEach(r => {
                txt += `📌 ID: ${r.id}\n👤 From: @${r.from.split('@')[0]}\n💬 Message: ${r.issue}\n🕐 Date: ${r.date}\n───────────────\n\n`;
            });
            return sock.sendMessage(chatId, { text: txt, mentions: reports.map(r => r.from) });
        }

        // ===== CREATE NEW REPORT =====
        if (!text) {
            return sock.sendMessage(chatId, { text: t('commands.report.usage') });
        }

        const reports = JSON.parse(fs.readFileSync(path));
        const newReport = { 
            id: Math.random().toString(36).substring(7).toUpperCase(),
            from: senderId,
            issue: text,
            date: new Date().toLocaleString()
        };
        
        reports.push(newReport);
        fs.writeFileSync(path, JSON.stringify(reports, null, 2));
        await sock.sendMessage(chatId, { text: t('commands.report.sent', { id: newReport.id }) });
    }
};