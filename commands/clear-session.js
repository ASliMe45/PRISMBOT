const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const confirmations = require('../lib/confirmations');

module.exports = {
    name: 'clear-session',
    alias: ['clearsession', 'clear-session', 'clearcreds'],
    async execute(sock, chatId, m, { args, senderIsOwner }) {
        // Only owner or sudo can clear session (owner preferred)
        const senderId = m.key.participant || m.key.remoteJid;
        const allowed = senderIsOwner || isOwnerOrSudo(senderId);
        if (!allowed) {
            await sock.sendMessage(chatId, { text: '❌ Only bot owner or sudo can use .clear-session' }, { quoted: m });
            return;
        }

        const confirmArg = args[0]?.toLowerCase();
        if (confirmArg !== 'confirm') {
            // Send interactive confirmation (reply with `.confirm` to this message)
            const sent = await sock.sendMessage(chatId, {
                text: `⚠️ *CLEAR SESSION*\n\nReply to this message with .confirm within 30s to confirm.\n\nThis will delete the local WhatsApp session files (session folder and baileys_store.json).`
            }, { quoted: m });

            // Register pending confirmation for this user in this chat
            confirmations.create(chatId, senderId, 'clear-session', '⚠️ *CLEAR SESSION*', 30 * 1000);
            return;
        }

        // Proceed with deletion (cleanup any pending confirmation)
        try { confirmations.remove(chatId, senderId); } catch {}
        const targets = ['session', 'baileys_store.json'];
        const removed = [];
        const failed = [];

        for (const t of targets) {
            try {
                const p = path.join(process.cwd(), t);
                if (fs.existsSync(p)) {
                    fs.rmSync(p, { recursive: true, force: true });
                    removed.push(t);
                }
            } catch (e) {
                failed.push({ target: t, error: String(e.message || e) });
            }
        }

        let reply = '✅ Clear session completed.';
        if (removed.length) reply += `\nRemoved: ${removed.join(', ')}`;
        if (failed.length) reply += `\nFailed: ${failed.map(f => `${f.target} (${f.error})`).join(', ')}`;

        await sock.sendMessage(chatId, { text: reply }, { quoted: m });

        // Recommend restart to complete the operation
        try {
            await sock.sendMessage(chatId, { text: '🔄 Restarting the bot to complete session clear...' });
        } catch {}

        // Allow messages to be delivered then exit
        setTimeout(() => process.exit(0), 500);
    }
};