const fs = require('fs');
const path = './data/reports.json';

module.exports = {
    name: 'report',
    alias: ['reportar'],
    async execute(sock, chatId, m, { text, senderId, senderIsOwner, args }) {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));

        if (args[0] === 'list' && senderIsOwner) {
            const reports = JSON.parse(fs.readFileSync(path));
            let txt = "🚩 *REPORTES ACTIVOS*\n\n";
            reports.forEach(r => txt += `ID: ${r.id}\nDe: @${r.from.split('@')[0]}\nMsg: ${r.issue}\n---\n`);
            return sock.sendMessage(chatId, { text: txt, mentions: reports.map(r => r.from) });
        }

        const reports = JSON.parse(fs.readFileSync(path));
        const newReport = { id: Math.random().toString(36).substring(7).toUpperCase(), from: senderId, issue: text, date: new Date().toLocaleString() };
        reports.push(newReport);
        fs.writeFileSync(path, JSON.stringify(reports, null, 2));
        await sock.sendMessage(chatId, { text: `✅ Reporte enviado. ID: ${newReport.id}` });
    }
};