/**
 * COMANDO: HELP/MENU
 * Muestra el menú de ayuda con todos los comandos disponibles
 */

module.exports = {
    name: 'help',
    alias: ['menu'],
    async execute(sock, chatId, m, { settings }) {
        // Construir el menú de ayuda
        const menu = `
╭──『 *${settings.botName}* 』──╮
│
┝─『 *MULTIMEDIA* 』
│ .s / .sticker ➜ Convertir a sticker
│ .simage ➜ Convertir a imagen
│
┝─『 *HERRAMIENTAS* 』
│ .trt <idioma> <texto> ➜ Traducir texto
│ .tts <texto> ➜ Convertir a audio
│ .report <motivo> ➜ Reportar al owner
│
┝─『 *GRUPOS* 』
│ .ban / .kick ➜ Banear usuario
│ .mute <minutos> ➜ Silenciar usuario
│ .tagall ➜ Mencionar a todos
│ .welcome <on/off/set> ➜ Bienvenidas automáticas
│ .goodbye <on/off/set> ➜ Despedidas automáticas
│ .giveaway <start/end> ➜ Crear sorteos
│
┝─『 *SISTEMA* 』
│ .status ➜ Ver estado del bot
│ .update ➜ Actualizar bot
│ .reset ➜ Reiniciar bot
╰──────────────────╯`.trim();

        // Enviar el menú
        await sock.sendMessage(chatId, { text: menu }, { quoted: m });
    }
};