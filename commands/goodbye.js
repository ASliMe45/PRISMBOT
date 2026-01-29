/**
 * COMMAND: GOODBYE/FAREWELL
 * Configures automatic farewell messages for members who leave
 */

// ===== IMPORTS =====
const { addGoodbye, delGoodBye } = require('../lib/index');

module.exports = {
    name: 'goodbye',
    alias: ['farewell'],
    async execute(sock, chatId, m, { args, senderIsOwner }) {
        // Only the owner can use this command
        if (!senderIsOwner) return;
        
        // Extract action
        const action = args[0]?.toLowerCase();

        // ===== ACTION PROCESSING =====
        if (action === 'on') {
            // Enable automatic farewells
            await addGoodbye(chatId, true);
            await sock.sendMessage(chatId, { text: "✅ Automatic farewells enabled." });
            
        } else if (action === 'off') {
            // Disable automatic farewells
            await delGoodBye(chatId);
            await sock.sendMessage(chatId, { text: "🚫 Automatic farewells disabled." });
        } else {
            // Show help
            await sock.sendMessage(chatId, { 
                text: "❌ Incorrect usage\\n\\n.goodbye on ➜ Enable\\n.goodbye off ➜ Disable" 
            });
        }
    }
};
