/**
 * COMMAND: TTS/SAY/VOICE
 * Converts text to audio using Google voice synthesis
 */

module.exports = {
    name: 'tts',
    alias: ['say', 'voice', 'speak'],
    async execute(sock, chatId, m, { text, t }) {
        try {
            // Validate that there is text
            if (!text) {
                return sock.sendMessage(chatId, { text: t('commands.tts.needText') });
            }
            
            // Generate audio URL (Google Translate TTS)
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
            
            // Send audio as voice message
            await sock.sendMessage(chatId, { 
                audio: { url: ttsUrl }, 
                mimetype: 'audio/mp4', 
                ptt: true  // PTT = Push To Talk (voice message)
            }, { quoted: m });
        } catch (e) {
            console.error('Error in tts command:', e);
            await sock.sendMessage(chatId, { text: t('commands.tts.errorConverting') });
        }
    }
};