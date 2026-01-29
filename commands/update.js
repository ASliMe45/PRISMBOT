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
    async execute(sock, chatId, m, { senderIsOwner }) {
        try {
            // Only the owner can update
            if (!senderIsOwner) return;
            
            // Notify that it's checking for updates
            await sock.sendMessage(chatId, { text: `🔄 Checking for updates from ${settings.github.repo}...` });
            
            // Execute git pull from configured repository
            const gitCommand = `git pull origin ${settings.github.branch}`;
            exec(gitCommand, (err, stdout) => {
                if (err) {
                    console.error('Error in update:', err);
                    return sock.sendMessage(chatId, { text: `❌ Error: ${err.message}` });
                }
                
                // Check if already up to date
                if (stdout.includes('Already up to date')) {
                    return sock.sendMessage(chatId, { text: "✅ Bot is already on the latest version." });
                }
                
                // If there are updates, restart the bot
                sock.sendMessage(chatId, { text: "✅ Updated. Restarting in 3 seconds..." }).then(() => {
                    setTimeout(() => {
                        process.exit(0);
                    }, 3000);
                });
            });
        } catch (e) {
            console.error('Error in update command:', e);
            await sock.sendMessage(chatId, { text: "❌ Error updating the bot." });
        }
    }
};