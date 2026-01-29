/**
 * FUNCIONES AUXILIARES DE LA BASE DE DATOS
 * Maneja bienvenidas, despedidas, sudos y mensajes con newsletter
 */

// ===== IMPORTACIONES =====
const fs = require('fs-extra');
const path = './data/settings.json';
const settings = require('../settings');

// ===== INICIALIZACIÓN =====
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(path)) fs.writeJsonSync(path, { welcome: {}, goodbye: {}, sudos: [] });

module.exports = {
    // ===== FUNCIONES DE BASE DE DATOS =====
    
    /**
     * Obtiene toda la base de datos
     */
    getDb: () => fs.readJsonSync(path),
    
    /**
     * Guarda datos en la base de datos
     */
    saveDb: (data) => fs.writeJsonSync(path, data, { spaces: 2 }),
    
    // ===== FUNCIONES DE NEWSLETTER =====
    
    /**
     * Envía un mensaje con contexto de newsletter
     * Simula que el mensaje fue reenviado desde el newsletter
     * 
     * @param {object} sock - Socket de Baileys
     * @param {string} chatId - ID del chat
     * @param {object} messageContent - Contenido del mensaje
     * @param {object} quoted - Mensaje a responder (opcional)
     */
    sendWithNewsletter: async (sock, chatId, messageContent, quoted = null) => {
        const opts = quoted ? { quoted } : {};
        
        if (settings.newsletter.enabled) {
            messageContent.contextInfo = {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: settings.newsletter.jid,
                    newsletterName: settings.newsletter.name,
                    serverMessageId: -1
                }
            };
        }
        
        return sock.sendMessage(chatId, messageContent, opts);
    },
    
    // ===== FUNCIONES DE BIENVENIDA =====
    
    /**
     * Añade una bienvenida a un grupo
     */
    addWelcome: (chatId, status, msg = null) => {
        const db = fs.readJsonSync(path);
        if (!db.welcome) db.welcome = {};
        db.welcome[chatId] = { status, message: msg };
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    
    /**
     * Obtiene la configuración de bienvenida de un grupo
     */
    getWelcome: (chatId) => {
        const db = fs.readJsonSync(path);
        return db.welcome ? db.welcome[chatId] || null : null;
    },
    
    /**
     * Elimina la bienvenida de un grupo
     */
    delWelcome: (chatId) => {
        const db = fs.readJsonSync(path);
        if (db.welcome && db.welcome[chatId]) {
            delete db.welcome[chatId];
            fs.writeJsonSync(path, db, { spaces: 2 });
        }
    },

    // ===== FUNCIONES DE SUDOS (ADMINISTRADORES SECUNDARIOS) =====
    
    /**
     * Añade a un usuario como sudo
     */
    addSudo: (userId) => {
        const db = fs.readJsonSync(path);
        if (!db.sudos) db.sudos = [];
        if (!db.sudos.includes(userId)) {
            db.sudos.push(userId);
            fs.writeJsonSync(path, db, { spaces: 2 });
        }
    },
    
    /**
     * Elimina a un usuario como sudo
     */
    delSudo: (userId) => {
        const db = fs.readJsonSync(path);
        if (!db.sudos) db.sudos = [];
        db.sudos = db.sudos.filter(s => s !== userId);
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    
    /**
     * Verifica si un usuario es sudo
     */
    isSudo: (userId) => {
        const db = fs.readJsonSync(path);
        return db.sudos ? db.sudos.includes(userId) : false;
    },
    
    /**
     * Obtiene la lista de sudos
     */
    getSudos: () => {
        const db = fs.readJsonSync(path);
        return db.sudos || [];
    },

    // ===== FUNCIONES DE DESPEDIDAS =====
    
    /**
     * Añade una despedida a un grupo
     */
    addGoodbye: (chatId, status, msg = null) => {
        const db = fs.readJsonSync(path);
        if (!db.goodbye) db.goodbye = {};
        db.goodbye[chatId] = { status, message: msg };
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    
    /**
     * Obtiene la configuración de despedida de un grupo
     */
    getGoodbye: (chatId) => {
        const db = fs.readJsonSync(path);
        return db.goodbye ? db.goodbye[chatId] || null : null;
    },
    
    /**
     * Elimina la despedida de un grupo
     */
    delGoodBye: (chatId) => {
        const db = fs.readJsonSync(path);
        if (db.goodbye && db.goodbye[chatId]) {
            delete db.goodbye[chatId];
            fs.writeJsonSync(path, db, { spaces: 2 });
        }
    }
};