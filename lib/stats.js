const fs = require('fs');
const path = './data/stats.json';

module.exports = {
    register: (chatId, isGroup) => {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        let data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { commands: 0, groups: [] };
        data.commands++;
        if (isGroup && !data.groups.includes(chatId)) data.groups.push(chatId);
        fs.writeFileSync(path, JSON.stringify(data));
    },
    get: () => fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : { commands: 0, groups: [] }
};