/**
 * GESTOR DE ESTADÍSTICAS DEL BOT
 * Registra comandos ejecutados y grupos donde se usa el bot
 */

// ===== IMPORTACIONES =====
const fs = require('fs');
const path = './data/stats.json';

module.exports = {
    /**
     * Registra un comando ejecutado
     * Incrementa el contador y guarda el grupo si es necesario
     * 
     * @param {string} chatId - ID del chat donde se ejecutó el comando
     * @param {boolean} isGroup - ¿Es un grupo o chat privado?
     */
    register: (chatId, isGroup) => {
        // Crear carpeta de datos si no existe
        if (!fs.existsSync('./data')) fs.mkdirSync('./data');
        
        // Obtener datos existentes o crear nuevos
        let data = fs.existsSync(path) 
            ? JSON.parse(fs.readFileSync(path)) 
            : { commands: 0, groups: [] };
        
        // Incrementar contador de comandos
        data.commands++;
        
        // Añadir grupo a la lista si no está
        if (isGroup && !data.groups.includes(chatId)) {
            data.groups.push(chatId);
        }
        
        // Guardar datos
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
    },
    
    /**
     * Obtiene las estadísticas actuales
     * @returns {object} Objeto con comandos ejecutados y lista de grupos
     */
    get: () => fs.existsSync(path) 
        ? JSON.parse(fs.readFileSync(path)) 
        : { commands: 0, groups: [] }
};