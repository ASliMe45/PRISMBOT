const settings = require('./settings');
const loader = require('./lib/loader');
const isAdmin = require('./lib/isAdmin');

async function handleMessages(sock, chatUpdate) {
    try {
        const m = chatUpdate.messages[0];
        if (!m.message || m.key.fromMe) return;

        const chatId = m.key.remoteJid;
        const senderId = m.key.participant || m.key.remoteJid;
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
        
        if (!body.startsWith(settings.prefix)) return;

        const commandName = body.slice(settings.prefix.length).trim().split(/\s+/)[0].toLowerCase();
        const args = body.trim().split(/\s+/).slice(1);
        const text = args.join(" ");
        
        const isOwner = senderId.includes(settings.ownerNumber);
        const { isSenderAdmin, isBotAdmin } = chatId.endsWith('@g.us') ? await isAdmin(sock, chatId, senderId) : { isSenderAdmin: false, isBotAdmin: false };

        const commands = loader.getCommands();
        const cmd = commands.get(commandName) || [...commands.values()].find(c => c.alias?.includes(commandName));

        if (cmd) {
            await cmd.execute(sock, chatId, m, { args, text, isOwner, isSenderAdmin, isBotAdmin, commandName });
        }
    } catch (e) { console.error('Error main:', e); }
}

module.exports = { handleMessages };