/**
 * CONFIGURACIÓN GENERAL DEL BOT PRISMBOT
 * Este archivo contiene todas las configuraciones principales del bot
 */

module.exports = {
    // ===== INFORMACIÓN DEL BOT =====
    botName: "PRISMBOT",           // Nombre del bot
    packname: "PRISMBOT",          // Nombre del paquete de stickers
    author: "PRISM GEN",           // Autor del bot
    prefix: ".",                   // Prefijo de comandos
    
    // ===== NÚMEROS Y CONTACTOS =====
    ownerNumber: "4915511504529",  // Número del owner principal
    pairingNumber: "4915511504529", // Número para vincular el bot
    
    // ===== CONFIGURACIÓN DEL NEWSLETTER =====
    newsletter: {
        enabled: true,                                      // Activar/desactivar newsletter
        jid: '120363425540907918@newsletter',              // ID del newsletter
        name: 'PRISMBOT SYSTEM'                            // Nombre del newsletter
    },
    
    // ===== CONFIGURACIÓN DE VERSION =====
    version: "2.0.0"               // Versión del bot
};