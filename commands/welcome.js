/**
 * COMMAND: WELCOME
 * Configures automatic welcome messages for new members
 */

// ===== IMPORTS =====
const { addWelcome, delWelcome } = require('../lib/index');

module.exports = {
    name: 'welcome',
    alias: ['greeting'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        // Only the owner can use this command
        if (!senderIsOwner) return;
        
        // Extract action and content
        const action = args[0]?.toLowerCase();
        const content = args.slice(1).join(' ');

        // ===== ACTION PROCESSING =====
        if (action === 'on') {
            // Enable automatic welcomes
            await addWelcome(chatId, true);
            await sock.sendMessage(chatId, { text: "✅ Automatic greetings enabled." });
            
        } else if (action === 'off') {
            // Disable automatic welcomes
            await delWelcome(chatId);
            await sock.sendMessage(chatId, { text: "🚫 Automatic greetings disabled." });
            
        } else if (action === 'set') {
            // Configure custom welcome message
            if (!content) {
                return sock.sendMessage(chatId, { 
                    text: "❌ Usage: .welcome set Your message here\\n\\nVariables:\\n{user} = User name\\n{group} = Group name\\n\\nEx: .welcome set Welcome {user} to {group}" 
                });
            }
            await addWelcome(chatId, true, content);
            await sock.sendMessage(chatId, { text: "✅ Welcome message saved." });
        }
    }
};