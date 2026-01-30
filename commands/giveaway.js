/**
 * COMMAND: GIVEAWAY/RAFFLE
 * Allows creating raffles in the group and choosing winners randomly
 */

// ===== GIVEAWAY STORAGE =====
let giveawayCache = {};

module.exports = {
    name: 'giveaway',
    alias: ['raffle', 'contest'],
    async execute(sock, chatId, m, { args, text, senderIsOwner }) {
        try {
            // Only the owner can create raffles
            if (!senderIsOwner) return;
            
            const action = args[0]?.toLowerCase();

            // ===== START RAFFLE =====
            if (action === 'start') {
                const prize = args.slice(1).join(" ");
                if (!prize) {
                    return sock.sendMessage(chatId, { text: '❌ Usage: .giveaway start <prize>\n\nEx: .giveaway start Airpods' });
                }
                
                // Save raffle in cache
                giveawayCache[chatId] = { 
                    prize, 
                    status: 'active',
                    startedAt: new Date()
                };
                
                await sock.sendMessage(chatId, { 
                    text: `🎁 *GIVEAWAY STARTED*\n\n🎯 Prize: ${prize}`
                });

            // ===== END RAFFLE =====
            } else if (action === 'end') {
                // Check that there is an active raffle
                if (!giveawayCache[chatId]) {
                    return sock.sendMessage(chatId, { text: '❌ Error processing the giveaway.' });
                }
                
                // Get group participants
                const metadata = await sock.groupMetadata(chatId);
                const participants = metadata.participants;
                
                if (participants.length === 0) {
                    return sock.sendMessage(chatId, { text: '❌ No participants in the giveaway.' });
                }
                
                // Select random winner
                const winner = participants[Math.floor(Math.random() * participants.length)];
                const prizeInfo = giveawayCache[chatId];
                
                // Announce winner
                await sock.sendMessage(chatId, { 
                    text: `🏆 *GIVEAWAY ENDED*\n\n🎉 Winner: @${winner.id.split('@')[0]}\n🎁 Prize: ${prizeInfo.prize}`,
                    mentions: [winner.id]
                });
                
                // Remove raffle from cache
                delete giveawayCache[chatId];
            } else {
                // Show help
                await sock.sendMessage(chatId, { 
                    text: "⚙️ *RAFFLE COMMANDS*\n\n.giveaway start <prize> ➜ Start\n.giveaway end ➜ Finish and choose winner" 
                });
            }
        } catch (e) {
            console.error('Error in giveaway command:', e);
            await sock.sendMessage(chatId, { text: '❌ Error processing the giveaway.' });
        }
    }
};
