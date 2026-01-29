/**
 * COMANDO: GOODBYE/ADIOS
 * Configura mensajes automáticos de despedida para miembros que salen
 */

// ===== IMPORTACIONES =====
const { addGoodbye, delGoodBye } = require('../lib/index');

module.exports = {
    name: 'goodbye',
    alias: ['adios'],
    async execute(sock, chatId, m, { args, senderIsOwner }) {
        // Solo el owner puede usar este comando
        if (!senderIsOwner) return;
        
        // Extraer acción
        const action = args[0]?.toLowerCase();

        // ===== PROCESAMIENTO DE ACCIONES =====
        if (action === 'on') {
            // Activar despedidas automáticas
            await addGoodbye(chatId, true);
            await sock.sendMessage(chatId, { text: "✅ Despedidas automáticas activadas." });
            
        } else if (action === 'off') {
            // Desactivar despedidas automáticas
            await delGoodBye(chatId);
            await sock.sendMessage(chatId, { text: "🚫 Despedidas automáticas desactivadas." });
        } else {
            // Mostrar ayuda
            await sock.sendMessage(chatId, { 
                text: "❌ Uso incorrecto\\n\\n.goodbye on ➜ Activar\\n.goodbye off ➜ Desactivar" 
            });
        }
    }
};
