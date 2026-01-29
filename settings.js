/**
 * GENERAL CONFIGURATION FOR PRISMBOT
 * This file contains all main bot configurations
 */

module.exports = {
    // ===== BOT INFORMATION =====
    botName: "PRISMBOT",           // Bot name
    packname: "PRISMBOT",          // Sticker pack name
    author: "PRISM GEN",           // Bot author
    prefix: ".",                   // Command prefix
    
    // ===== NUMBERS AND CONTACTS =====
    ownerNumber: "5355409528",  // Main owner number
    pairingNumber: "5355409528", // Number to pair the bot
    
    // ===== NEWSLETTER CONFIGURATION =====
    newsletter: {
        enabled: true,                                      // Enable/disable newsletter
        jid: '120363425540907918@newsletter',              // Newsletter ID
        name: 'PRISMBOT SYSTEM'                            // Newsletter name
    },
    
    // ===== GITHUB CONFIGURATION (UPDATES) =====
    github: {
        repo: 'https://github.com/ASliMe45/PRISMBOT',      // Repository URL
        branch: 'main'                                      // Default branch
    },
    
    // ===== VERSION CONFIGURATION =====
    version: "2.0.0"               // Bot version
};