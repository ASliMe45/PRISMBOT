const confirmations = require('../lib/confirmations');
const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

module.exports = {
    name: 'confirm',
    alias: ['yes'],
    async execute(sock, chatId, m, { senderId, senderIsOwner }) {
        // Must be a reply to a confirmation message
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(chatId, { text: "⚠️ Reply to the bot's confirmation message with `.confirm` to proceed." }, { quoted: m });
        }

        // Text of the quoted message
        const quotedText = quoted.conversation || quoted.extendedTextMessage?.text || '';

        const pending = confirmations.get(chatId, senderId);
        if (!pending) {
            return sock.sendMessage(chatId, { text: '❌ No pending action found for you.' }, { quoted: m });
        }

        if (Date.now() > pending.expiresAt) {
            confirmations.remove(chatId, senderId);
            return sock.sendMessage(chatId, { text: '❌ The confirmation has expired.' }, { quoted: m });
        }

        if (!quotedText.includes(pending.botTextSnippet)) {
            return sock.sendMessage(chatId, { text: '❌ You are replying to a different message. Reply to the original confirmation message.' }, { quoted: m });
        }

        // Permission check
        const allowed = senderIsOwner || isOwnerOrSudo(senderId);
        if (!allowed) {
            confirmations.remove(chatId, senderId);
            return sock.sendMessage(chatId, { text: '❌ Only the owner or sudo can confirm this action.' }, { quoted: m });
        }

        // Currently support clear-session
        if (pending.action === 'clear-session') {
            confirmations.remove(chatId, senderId);

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

            try { await sock.sendMessage(chatId, { text: '🔄 Restarting the bot to complete session clear...' }); } catch {}
            setTimeout(() => process.exit(0), 500);
            return;
        }

        await sock.sendMessage(chatId, { text: '❌ Unknown pending action.' }, { quoted: m });
    }
};