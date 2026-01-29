const settings = require('../settings');
const { isSudo } = require('./index');

module.exports = function isOwnerOrSudo(senderId) {
    const number = senderId.split('@')[0];
    const ownerNumber = settings.ownerNumber.replace(/[^0-9]/g, '');
    
    // Is owner if the number matches settings.js OR if in the Sudos database
    return number === ownerNumber || isSudo(senderId);
};