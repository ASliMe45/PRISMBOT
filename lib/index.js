const fs = require('fs-extra');
const path = './data/settings.json';
const settings = require('../settings');

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(path)) fs.writeJsonSync(path, { welcome: {}, sudos: [] });

module.exports = {
    getDb: () => fs.readJsonSync(path),
    saveDb: (data) => fs.writeJsonSync(path, data, { spaces: 2 }),
    
    // Send message with newsletter context
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
    
    // Welcome functions
    addWelcome: (chatId, status, msg = null) => {
        const db = fs.readJsonSync(path);
        if (!db.welcome) db.welcome = {};
        db.welcome[chatId] = { status, message: msg };
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    getWelcome: (chatId) => {
        const db = fs.readJsonSync(path);
        return db.welcome ? db.welcome[chatId] || null : null;
    },
    delWelcome: (chatId) => {
        const db = fs.readJsonSync(path);
        if (db.welcome && db.welcome[chatId]) {
            delete db.welcome[chatId];
            fs.writeJsonSync(path, db, { spaces: 2 });
        }
    },

    // Sudo functions
    addSudo: (userId) => {
        const db = fs.readJsonSync(path);
        if (!db.sudos) db.sudos = [];
        if (!db.sudos.includes(userId)) {
            db.sudos.push(userId);
            fs.writeJsonSync(path, db, { spaces: 2 });
        }
    },
    delSudo: (userId) => {
        const db = fs.readJsonSync(path);
        if (!db.sudos) db.sudos = [];
        db.sudos = db.sudos.filter(s => s !== userId);
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    isSudo: (userId) => {
        const db = fs.readJsonSync(path);
        return db.sudos ? db.sudos.includes(userId) : false;
    },
    getSudos: () => {
        const db = fs.readJsonSync(path);
        return db.sudos || [];
    },

    // Goodbye functions (alias for welcome)
    addGoodbye: (chatId, status, msg = null) => {
        const db = fs.readJsonSync(path);
        if (!db.goodbye) db.goodbye = {};
        db.goodbye[chatId] = { status, message: msg };
        fs.writeJsonSync(path, db, { spaces: 2 });
    },
    getGoodbye: (chatId) => {
        const db = fs.readJsonSync(path);
        return db.goodbye ? db.goodbye[chatId] || null : null;
    },
    delGoodBye: (chatId) => {
        const db = fs.readJsonSync(path);
        if (db.goodbye && db.goodbye[chatId]) {
            delete db.goodbye[chatId];
            fs.writeJsonSync(path, db, { spaces: 2 });
        }
    }
};