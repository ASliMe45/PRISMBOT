const fs = require('fs-extra');
const path = './data/settings.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync(path)) fs.writeJsonSync(path, { welcome: {}, sudos: [] });

module.exports = {
    getDb: () => fs.readJsonSync(path),
    saveDb: (data) => fs.writeJsonSync(path, data, { spaces: 2 }),
    
    addWelcome: (chatId, status, msg = null) => {
        const db = fs.readJsonSync(path);
        db.welcome[chatId] = { status, message: msg };
        fs.writeJsonSync(path, db);
    },
    getWelcome: (chatId) => fs.readJsonSync(path).welcome[chatId] || null
};