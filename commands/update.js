const { exec } = require('child_process');

module.exports = {
    name: 'update',
    alias: ['actualizar'],
    async execute(sock, chatId, m, { senderIsOwner }) {
        if (!senderIsOwner) return;
        await sock.sendMessage(chatId, { text: "🔄 Buscando actualizaciones..." });
        
        exec('git pull', (err, stdout) => {
            if (err) return sock.sendMessage(chatId, { text: `❌ Error: ${err.message}` });
            if (stdout.includes('Already up to date')) {
                return sock.sendMessage(chatId, { text: "✅ El bot ya está en la última versión." });
            }
            sock.sendMessage(chatId, { text: "✅ Actualizado. Reiniciando..." }).then(() => {
                process.exit();
            });
        });
    }
};