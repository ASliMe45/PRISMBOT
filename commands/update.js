const { exec } = require('child_process');
const settings = require('../settings');

module.exports = {
    name: 'update',
    alias: ['actualizar', 'upd'],
    async execute(sock, chatId, m, { senderIsOwner }) {
        try {
            // 1. Verificación de seguridad estricta
            if (!senderIsOwner) return;

            await sock.sendMessage(chatId, { text: "🔄 *PRISMBOT UPDATE SYSTEM*\n\nConectando con el repositorio de GitHub..." });

            const repoUrl = settings.github.repo;
            const branch = settings.github.branch || 'main';

            // 2. Comando Maestro:
            // - Configura el origen por si acaso se perdió
            // - Trae los cambios
            // - Fuerza el reset para ignorar cambios locales que bloquean el pull
            const fullCommand = `
                git remote set-url origin ${repoUrl} && 
                git fetch --all && 
                git reset --hard origin/${branch} && 
                git pull origin ${branch}
            `.trim().replace(/\n/g, '');

            exec(fullCommand, (err, stdout, stderr) => {
                if (err) {
                    console.error('Error detallado de Git:', err);
                    return sock.sendMessage(chatId, { 
                        text: `❌ *FALLO EN LA ACTUALIZACIÓN*\n\n*Error:* ${err.message}\n\n*Posible solución:* Asegúrate de que el bot tenga permisos de escritura en el hosting.` 
                    });
                }

                // Verificar salida
                if (stdout.includes('Already up to date')) {
                    return sock.sendMessage(chatId, { text: "✅ *SISTEMA AL DÍA*\n\nEl bot ya tiene la última versión instalada." });
                }

                // 3. Éxito: Notificar y reiniciar
                sock.sendMessage(chatId, { 
                    text: `✅ *ACTUALIZACIÓN COMPLETADA*\n\n*Repositorio:* ${repoUrl}\n*Rama:* ${branch}\n\nEl bot se reiniciará en 5 segundos para aplicar los cambios.` 
                }).then(() => {
                    setTimeout(() => {
                        process.exit(0); 
                    }, 5000);
                });
            });
        } catch (e) {
            console.error('Error en el comando update:', e);
            await sock.sendMessage(chatId, { text: "❌ *ERROR CRÍTICO*\nNo se pudo ejecutar el proceso de actualización." });
        }
    }
};