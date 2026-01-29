/**
 * COMMAND LOADER
 * Automatically loads all commands from the /commands directory
 */

// ===== IMPORTS =====
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// ===== COMMAND STORAGE =====
let commands = new Map();

/**
 * Loads all commands from the /commands directory
 * Searches for .js files and registers them in the commands map
 */
const loadCommands = () => {
    const commandsPath = path.join(__dirname, '../commands');
    
    // Check if commands folder exists
    if (!fs.existsSync(commandsPath)) {
        console.log(chalk.yellow('⚠️ Commands folder not found'));
        return;
    }

    // Get all .js files
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    // Load each command
    for (const file of files) {
        try {
            const cmd = require(path.join(commandsPath, file));
            
            // Check that command has a name
            if (cmd.name) {
                commands.set(cmd.name, cmd);
            } else {
                console.warn(chalk.yellow(`⚠️ Command ${file} does not have 'name' property`));
            }
        } catch (e) {
            console.error(chalk.red(`❌ Error loading command ${file}:`), e.message);
        }
    }
    
    // Show number of loaded commands
    console.log(chalk.green(`🚀 ${commands.size} commands loaded successfully.`));
};

// Load commands on startup
loadCommands();

module.exports = {
    /**
     * Gets the map of all loaded commands
     * @returns {Map} Commands map
     */
    getCommands: () => commands
};
