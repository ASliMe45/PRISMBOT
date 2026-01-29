/**
 * INTERNATIONALIZATION (i18n) SYSTEM
 * Manages translations and language loading
 */

// ===== IMPORTS =====
const fs = require('fs');
const path = require('path');

// ===== LANGUAGE STORAGE =====
let languages = {};

/**
 * Loads all language files from translations directory
 */
const loadLanguages = () => {
    const translationsPath = path.join(__dirname, '../translations');
    
    if (!fs.existsSync(translationsPath)) {
        console.warn('⚠️ translations folder not found');
        return;
    }

    const files = fs.readdirSync(translationsPath).filter(file => file.endsWith('.json'));
    
    for (const file of files) {
        const lang = file.replace('.json', '');
        const filePath = path.join(translationsPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        languages[lang] = JSON.parse(content);
    }

    console.log(`🌐 ${Object.keys(languages).length} languages loaded: ${Object.keys(languages).join(', ')}`);
};

// Load languages on startup
loadLanguages();

/**
 * Gets a translated string
 * @param {string} lang - Language code (es, en, etc)
 * @param {string} key - Translation key (commands.help.title)
 * @param {*} defaultValue - Default value if key not found
 * @returns {string} Translated string
 */
const t = (lang = 'en', key, defaultValue = key) => {
    if (!languages[lang]) {
        console.warn(`⚠️ Language '${lang}' not loaded, using 'en'`);
        lang = 'en';
    }

    const keys = key.split('.');
    let value = languages[lang];

    for (const k of keys) {
        if (value[k] !== undefined) {
            value = value[k];
        } else {
            return defaultValue;
        }
    }

    return value;
};

/**
 * Gets all available languages
 * @returns {array} Array of language codes
 */
const getAvailableLanguages = () => Object.keys(languages);

/**
 * Checks if a language is available
 * @param {string} lang - Language code
 * @returns {boolean} True if language exists
 */
const isValidLanguage = (lang) => Object.keys(languages).includes(lang);

module.exports = {
    t,
    getAvailableLanguages,
    isValidLanguage,
    loadLanguages
};
