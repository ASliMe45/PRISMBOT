/**
 * VERIFICADOR DE PERMISOS DE ADMINISTRADOR
 * Valida si un usuario o el bot son administradores del grupo
 */

/**
 * Verifica si un usuario y el bot son administradores
 * 
 * @param {object} sock - Socket de Baileys
 * @param {string} chatId - ID del grupo
 * @param {string} senderId - ID del usuario a verificar
 * @returns {object} Objeto con propiedades isSenderAdmin e isBotAdmin
 */
module.exports = async (sock, chatId, senderId) => {
    try {
        // Obtener metadata del grupo
        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];
        
        // Obtener ID del bot
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Buscar el usuario en los participantes
        const sender = participants.find(p => p.id === senderId);
        
        // Buscar al bot en los participantes
        const bot = participants.find(p => p.id === botId || p.id === sock.user.id);

        // Retornar si ambos son administradores
        return {
            isSenderAdmin: sender?.admin?.includes('admin') || false,
            isBotAdmin: bot?.admin?.includes('admin') || false
        };
    } catch (error) {
        // En caso de error, retornar false para ambos
        console.error('Error al verificar admin:', error.message);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
};