/**
 * COMANDO: GIVEAWAY/SORTEO
 * Permite crear sorteos en el grupo y elegir ganadores aleatoriamente
 */

// ===== ALMACENAMIENTO DE SORTEOS =====
let giveawayCache = {};

module.exports = {
    name: 'giveaway',
    alias: ['sorteo', 'concurso'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        try {
            // Solo el owner puede hacer sorteos
            if (!senderIsOwner) return;
            
            const action = args[0]?.toLowerCase();

            // ===== INICIAR SORTEO =====
            if (action === 'start') {
                const prize = args.slice(1).join(" ");
                if (!prize) {
                    return sock.sendMessage(chatId, { text: "❌ Uso: .giveaway start <premio>\n\nEj: .giveaway start Airpods" });
                }
                
                // Guardar sorteo en caché
                giveawayCache[chatId] = { 
                    prize, 
                    status: 'active',
                    startedAt: new Date()
                };
                
                await sock.sendMessage(chatId, { 
                    text: `🎉 *SORTEO INICIADO*\n━━━━━━━━━━━━━━━━\n🎁 Premio: ${prize}\n\nReacciona con 👋 para participar\n\n.giveaway end (para finalizar)` 
                });

            // ===== FINALIZAR SORTEO =====
            } else if (action === 'end') {
                // Verificar que haya un sorteo activo
                if (!giveawayCache[chatId]) {
                    return sock.sendMessage(chatId, { text: "❌ No hay sorteo activo en este grupo." });
                }
                
                // Obtener participantes del grupo
                const metadata = await sock.groupMetadata(chatId);
                const participants = metadata.participants;
                
                if (participants.length === 0) {
                    return sock.sendMessage(chatId, { text: "❌ No hay participantes en el grupo." });
                }
                
                // Seleccionar ganador aleatorio
                const winner = participants[Math.floor(Math.random() * participants.length)];
                const prizeInfo = giveawayCache[chatId];
                
                // Anunciar ganador
                await sock.sendMessage(chatId, { 
                    text: `🎊 *SORTEO FINALIZADO*\n━━━━━━━━━━━━━━━━\n🏆 Ganador: @${winner.id.split('@')[0]}\n🎁 Premio: ${prizeInfo.prize}\n\n¡Felicitaciones!`,
                    mentions: [winner.id]
                });
                
                // Eliminar sorteo de caché
                delete giveawayCache[chatId];
            } else {
                // Mostrar ayuda
                await sock.sendMessage(chatId, { 
                    text: "⚙️ *COMANDOS DE SORTEO*\n\n.giveaway start <premio> ➜ Iniciar\n.giveaway end ➜ Finalizar y elegir ganador" 
                });
            }
        } catch (e) {
            console.error('Error en comando giveaway:', e);
            await sock.sendMessage(chatId, { text: "❌ Error al procesar el sorteo." });
        }
    }
};
