/**
 * COMMAND: UPDATE/UPGRADE
 * Updates the bot from the remote repository and restarts it
 */

// ===== IMPORTS =====
const { exec } = require('child_process');
const settings = require('../settings');

module.exports = {
    name: 'update',
    alias: ['upgrade', 'upd'],
    async execute(sock, chatId, m, { senderIsOwner, t }) {
        try {
            // Only the owner can update
            if (!senderIsOwner) return;
            
            // Notify that it's checking for updates
            await sock.sendMessage(chatId, { text: t('commands.update.checking') });
            
            // Execute git pull from configured repository
            const gitCommand = `git pull origin ${settings.github.branch}`;
            exec(gitCommand, (err, stdout) => {
                if (err) {
                    console.error('Error in update:', err);
                    return sock.sendMessage(chatId, { text: t('commands.update.error') });
                }
                
                // Check if already up to date
                if (stdout.includes('Already up to date')) {
                    return sock.sendMessage(chatId, { text: t('commands.update.noUpdates') });
                }
                
                // If there are updates, restart the bot
                sock.sendMessage(chatId, { text: t('commands.update.updating') }).then(() => {
                    setTimeout(() => {
                        process.exit(0);
                    }, 3000);
                });
            });
        } catch (e) {
            console.error('Error in update command:', e);
            await sock.sendMessage(chatId, { text: t('commands.update.error') });
        }
    }
};