/**
 * COMANDO: REPORT/REPORTAR
 * Permite a los usuarios reportar problemas al owner
 */

// ===== IMPORTACIONES =====
const fs = require('fs');
const path = './data/reports.json';

module.exports = {
    name: 'report',
    alias: ['reportar'],
    async execute(sock, chatId, m, { text, senderId, senderIsOwner, args }) {
        // Crear carpeta y archivo si no existen
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify([]));

        // ===== LISTAR REPORTES (Solo owner) =====
        if (args[0] === 'list' && senderIsOwner) {
            const reports = JSON.parse(fs.readFileSync(path));
            
            if (reports.length === 0) {
                return sock.sendMessage(chatId, { text: "📋 No hay reportes" });
            }
            
            let txt = "🚩 *REPORTES ACTIVOS*\n━━━━━━━━━━━━━━━━\n\n";
            reports.forEach(r => {
                txt += `📌 ID: ${r.id}\n👤 De: @${r.from.split('@')[0]}\n💬 Mensaje: ${r.issue}\n🕐 Fecha: ${r.date}\n───────────────\n\n`;
            });
            return sock.sendMessage(chatId, { text: txt, mentions: reports.map(r => r.from) });
        }

        // ===== CREAR NUEVO REPORTE =====
        if (!text) {
            return sock.sendMessage(chatId, { text: "❌ Uso: .report <tu mensaje de reporte>" });
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
        await sock.sendMessage(chatId, { text: `✅ Reporte enviado. ID: ${newReport.id}` });
    }
};