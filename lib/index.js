/**
 * DATABASE HELPER FUNCTIONS
 * Handles greetings, farewells, sudos and newsletter messages
 */

// ===== IMPORTS =====
const fs = require('fs-extra');
const path = './data/settings.json';
const settings = require('../settings');

// ===== INITIALIZATION =====
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(path)) fs.writeJsonSync(path, { welcome: {}, goodbye: {}, sudos: [] });

module.exports = {
    // ===== DATABASE FUNCTIONS =====
    
    /**
     * Gets the entire database
     */
    getDb: () => fs.readJsonSync(path),
    
    /**
     * Saves data to database
     */
    saveDb: (data) => fs.writeJsonSync(path, data, { spaces: 2 }),
    
    // ===== NEWSLETTER FUNCTIONS =====
    
    /**
     * Sends a message with newsletter context
     * Simulates that the message was forwarded from the newsletter
     * 
     * @param {object} sock - Baileys socket
     * @param {string} chatId - Chat ID
     * @param {object} messageContent - Message content
     * @param {object} quoted - Message to reply to (optional)
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
    
    // ===== WELCOME FUNCTIONS =====
    
    /**
     * Adds a welcome message to a group
     */
    addWelcome: (chatId, status, msg = null) => {
        const db = fs.readJsonSync(path);
        if (!db.welcome) db.welcome = {};
        db.welcome[chatId] = { status, message: msg };
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    
    /**
     * Gets the welcome configuration of a group
     */
    getWelcome: (chatId) => {
        const db = fs.readJsonSync(path);
        return db.welcome ? db.welcome[chatId] || null : null;
    },
    
    /**
     * Removes the welcome message from a group
     */
    delWelcome: (chatId) => {
        const db = fs.readJsonSync(path);
        if (db.welcome && db.welcome[chatId]) {
            delete db.welcome[chatId];
            fs.writeJsonSync(path, db, { spaces: 2 });
        }
    },

    // ===== SUDOS FUNCTIONS (SECONDARY ADMINISTRATORS) =====
    
    /**
     * Adds a user as sudo
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
     * Removes a user as sudo
     */
    delSudo: (userId) => {
        const db = fs.readJsonSync(path);
        if (!db.sudos) db.sudos = [];
        db.sudos = db.sudos.filter(s => s !== userId);
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    
    /**
     * Checks if a user is sudo
     */
    isSudo: (userId) => {
        const db = fs.readJsonSync(path);
        return db.sudos ? db.sudos.includes(userId) : false;
    },
    
    /**
     * Gets the sudos list
     */
    getSudos: () => {
        const db = fs.readJsonSync(path);
        return db.sudos || [];
    },

    // ===== FAREWELL FUNCTIONS =====
    
    /**
     * Adds a farewell message to a group
     */
    addGoodbye: (chatId, status, msg = null) => {
        const db = fs.readJsonSync(path);
        if (!db.goodbye) db.goodbye = {};
        db.goodbye[chatId] = { status, message: msg };
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    
    /**
     * Gets the farewell configuration of a group
     */
    getGoodbye: (chatId) => {
        const db = fs.readJsonSync(path);
        return db.goodbye ? db.goodbye[chatId] || null : null;
    },
    
    /**
     * Removes the farewell message from a group
     */
    delGoodBye: (chatId) => {
        const db = fs.readJsonSync(path);
        if (db.goodbye && db.goodbye[chatId]) {
            delete db.goodbye[chatId];
            fs.writeJsonSync(path, db, { spaces: 2 });
        }
    }
};