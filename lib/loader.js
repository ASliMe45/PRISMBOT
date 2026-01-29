const fs = require('fs');
const path = require('path');

let commands = new Map();

const loadCommands = () => {
    const commandsPath = path.join(__dirname, '../commands');
    if (!fs.existsSync(commandsPath)) return;

    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of files) {
        try {
            const cmd = require(path.join(commandsPath, file));
            if (cmd.name) {
                commands.set(cmd.name, cmd);
            }
        } catch (e) {
            console.error(`Error cargando comando ${file}:`, e);
        }
    }
    console.log(`🚀 ${commands.size} comandos cargados con éxito.`);
};

loadCommands();

module.exports = {
    getCommands: () => commands
};
