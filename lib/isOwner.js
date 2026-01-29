const settings = require('../settings');
const { isSudo } = require('./index');

module.exports = function isOwnerOrSudo(senderId) {
    const number = senderId.split('@')[0];
    const ownerNumber = settings.ownerNumber.replace(/[^0-9]/g, '');
    
    // Es dueño si el número coincide con settings.js O si está en la base de datos de Sudos
    return number === ownerNumber || isSudo(senderId);
};