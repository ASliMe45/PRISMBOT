/**
 * CARGADOR DE COMANDOS
 * Carga automáticamente todos los comandos del directorio /commands
 */

// ===== IMPORTACIONES =====
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// ===== ALMACENAMIENTO DE COMANDOS =====
let commands = new Map();

/**
 * Carga todos los comandos del directorio /commands
 * Busca archivos .js y los registra en el mapa de comandos
 */
const loadCommands = () => {
    const commandsPath = path.join(__dirname, '../commands');
    
    // Verificar si la carpeta de comandos existe
    if (!fs.existsSync(commandsPath)) {
        console.log(chalk.yellow('⚠️ Carpeta de comandos no encontrada'));
        return;
    }

    // Obtener todos los archivos .js
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    // Cargar cada comando
    for (const file of files) {
        try {
            const cmd = require(path.join(commandsPath, file));
            
            // Verificar que el comando tenga un nombre
            if (cmd.name) {
                commands.set(cmd.name, cmd);
            } else {
                console.warn(chalk.yellow(`⚠️ Comando ${file} no tiene propiedad 'name'`));
            }
        } catch (e) {
            console.error(chalk.red(`❌ Error cargando comando ${file}:`), e.message);
        }
    }
    
    // Mostrar cantidad de comandos cargados
    console.log(chalk.green(`🚀 ${commands.size} comandos cargados con éxito.`));
};

// Cargar comandos al iniciar
loadCommands();

module.exports = {
    /**
     * Obtiene el mapa de todos los comandos cargados
     * @returns {Map} Mapa de comandos
     */
    getCommands: () => commands
};
