/**
 * COMANDO: WELCOME
 * Configura mensajes automáticos de bienvenida para nuevos miembros
 */

// ===== IMPORTACIONES =====
const { addWelcome, delWelcome } = require('../lib/index');

module.exports = {
    name: 'welcome',
    alias: ['bienvenida'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        // Solo el owner puede usar este comando
        if (!senderIsOwner) return;
        
        // Extraer acción y contenido
        const action = args[0]?.toLowerCase();
        const content = args.slice(1).join(' ');

        // ===== PROCESAMIENTO DE ACCIONES =====
        if (action === 'on') {
            // Activar bienvenidas automáticas
            await addWelcome(chatId, true);
            await sock.sendMessage(chatId, { text: "✅ Bienvenidas automáticas activadas." });
            
        } else if (action === 'off') {
            // Desactivar bienvenidas automáticas
            await delWelcome(chatId);
            await sock.sendMessage(chatId, { text: "🚫 Bienvenidas automáticas desactivadas." });
            
        } else if (action === 'set') {
            // Configurar mensaje personalizado de bienvenida
            if (!content) {
                return sock.sendMessage(chatId, { 
                    text: "❌ Uso: .welcome set Tu mensaje aquí\\n\\nVariables:\\n{user} = Nombre del usuario\\n{group} = Nombre del grupo\\n\\nEj: .welcome set Bienvenido {user} a {group}" 
                });
            }
            await addWelcome(chatId, true, content);
            await sock.sendMessage(chatId, { text: "✅ Mensaje de bienvenida guardado." });
        }
    }
};