/**
 * COMANDO: UPDATE/ACTUALIZAR
 * Actualiza el bot desde el repositorio remoto y lo reinicia
 */

// ===== IMPORTACIONES =====
const { exec } = require('child_process');
const settings = require('../settings');

module.exports = {
    name: 'update',
    alias: ['actualizar', 'upgrade'],
    async execute(sock, chatId, m, { senderIsOwner }) {
        try {
            // Solo el owner puede actualizar
            if (!senderIsOwner) return;
            
            // Notificar que está buscando actualizaciones
            await sock.sendMessage(chatId, { text: `🔄 Buscando actualizaciones desde ${settings.github.repo}...` });
            
            // Ejecutar git pull desde el repositorio configurado
            const gitCommand = `git pull origin ${settings.github.branch}`;
            exec(gitCommand, (err, stdout) => {
                if (err) {
                    console.error('Error en actualización:', err);
                    return sock.sendMessage(chatId, { text: `❌ Error: ${err.message}` });
                }
                
                // Verificar si ya está actualizado
                if (stdout.includes('Already up to date')) {
                    return sock.sendMessage(chatId, { text: "✅ El bot ya está en la última versión." });
                }
                
                // Si hay actualizaciones, reiniciar el bot
                sock.sendMessage(chatId, { text: "✅ Actualizado. Reiniciando en 3 segundos..." }).then(() => {
                    setTimeout(() => {
                        process.exit(0);
                    }, 3000);
                });
            });
        } catch (e) {
            console.error('Error en comando update:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al actualizar el bot." });
        }
    }
};