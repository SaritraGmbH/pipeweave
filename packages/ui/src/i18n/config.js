// i18n-config.js

// Complete language definitions with flags and native names
const ALL_LANGUAGES = [
	{ code: "bg", name: "Български", flag: "🇧🇬" },
	{ code: "cs", name: "Čeština", flag: "🇨🇿" },
	{ code: "da", name: "Dansk", flag: "🇩🇰" },
	{ code: "de", name: "Deutsch", flag: "🇩🇪" },
	{ code: "el", name: "Ελληνικά", flag: "🇬🇷" },
	{ code: "en", name: "English", flag: "🇺🇸" },
	{ code: "es", name: "Español", flag: "🇪🇸" },
	{ code: "et", name: "Eesti", flag: "🇪🇪" },
	{ code: "fi", name: "Suomi", flag: "🇫🇮" },
	{ code: "fr", name: "Français", flag: "🇫🇷" },
	{ code: "hr", name: "Hrvatski", flag: "🇭🇷" },
	{ code: "hu", name: "Magyar", flag: "🇭🇺" },
	{ code: "is", name: "Íslenska", flag: "🇮🇸" },
	{ code: "ga", name: "Gaeilge", flag: "🇮🇪" },
	{ code: "it", name: "Italiano", flag: "🇮🇹" },
	{ code: "lv", name: "Latviešu", flag: "🇱🇻" },
	{ code: "lt", name: "Lietuvių", flag: "🇱🇹" },
	{ code: "mt", name: "Malti", flag: "🇲🇹" },
	{ code: "nl", name: "Nederlands", flag: "🇳🇱" },
	{ code: "pl", name: "Polski", flag: "🇵🇱" },
	{ code: "pt", name: "Português", flag: "🇵🇹" },
	{ code: "ro", name: "Română", flag: "🇷🇴" },
	{ code: "sk", name: "Slovenčina", flag: "🇸🇰" },
	{ code: "sl", name: "Slovenščina", flag: "🇸🇮" },
	{ code: "sv", name: "Svenska", flag: "🇸🇪" },
];

// Configure which languages are enabled
// Set to true to enable, false to disable
const ENABLED_LANGUAGES = {
	bg: false, // Bulgarian
	cs: false, // Czech
	da: false, // Danish
	de: true, // German
	el: false, // Greek
	en: true, // English
	es: true, // Spanish
	et: false, // Estonian
	fi: false, // Finnish
	fr: true, // French
	hr: false, // Croatian
	hu: false, // Hungarian
	is: false, // Icelandic
	ga: false, // Irish
	it: true, // Italian
	lv: false, // Latvian
	lt: false, // Lithuanian
	mt: false, // Maltese
	nl: false, // Dutch
	pl: false, // Polish
	pt: false, // Portuguese
	ro: false, // Romanian
	sk: false, // Slovak
	sl: false, // Slovenian
	sv: false, // Swedish
};

// Cache for computed configurations
let _cachedLocales = null;
let _cachedLanguages = null;
let _lastConfigHash = null;

/**
 * Generate a simple hash of the enabled languages configuration
 * to detect changes and invalidate cache
 */
function generateConfigHash() {
	return JSON.stringify(ENABLED_LANGUAGES);
}

/**
 * Validate that all enabled languages have complete configurations
 */
function validateConfiguration() {
	const enabledCodes = Object.keys(ENABLED_LANGUAGES).filter((code) => ENABLED_LANGUAGES[code]);
	const availableCodes = new Set(ALL_LANGUAGES.map((lang) => lang.code));

	const missingConfigs = enabledCodes.filter((code) => !availableCodes.has(code));

	if (missingConfigs.length > 0) {
		throw new Error(
			`Missing language configuration for enabled locales: ${missingConfigs.join(", ")}. ` +
				`Please add complete language definitions to ALL_LANGUAGES array.`,
		);
	}
}

/**
 * Get array of enabled locale codes
 * @returns {string[]} Array of enabled locale codes
 */
function getEnabledLocales() {
	const currentConfigHash = generateConfigHash();

	// Return cached result if configuration hasn't changed
	if (_cachedLocales && _lastConfigHash === currentConfigHash) {
		return _cachedLocales;
	}

	// Validate configuration before processing
	validateConfiguration();

	// Generate new locale list
	_cachedLocales = Object.keys(ENABLED_LANGUAGES)
		.filter((code) => ENABLED_LANGUAGES[code])
		.sort(); // Sort alphabetically for consistency

	_lastConfigHash = currentConfigHash;

	return _cachedLocales;
}

/**
 * Get language switcher configuration for enabled languages
 * @returns {Array<{code: string, name: string, flag: string}>} Array of enabled language objects
 */
function getLanguageSwitcherConfig() {
	const currentConfigHash = generateConfigHash();

	// Return cached result if configuration hasn't changed
	if (_cachedLanguages && _lastConfigHash === currentConfigHash) {
		return _cachedLanguages;
	}

	// Validate configuration before processing
	validateConfiguration();

	// Generate new language switcher config
	const enabledCodes = new Set(Object.keys(ENABLED_LANGUAGES).filter((code) => ENABLED_LANGUAGES[code]));

	_cachedLanguages = ALL_LANGUAGES.filter((lang) => enabledCodes.has(lang.code)).sort((a, b) =>
		a.name.localeCompare(b.name),
	); // Sort by native name

	_lastConfigHash = currentConfigHash;

	return _cachedLanguages;
}

/**
 * Clear cache - useful for testing or dynamic configuration changes
 */
function clearCache() {
	_cachedLocales = null;
	_cachedLanguages = null;
	_lastConfigHash = null;
}

/**
 * Get configuration for a specific language code
 * @param {string} code - Language code
 * @returns {Object|null} Language configuration object or null if not found/enabled
 */
function getLanguageConfig(code) {
	if (!ENABLED_LANGUAGES[code]) {
		return null;
	}

	return ALL_LANGUAGES.find((lang) => lang.code === code) || null;
}

/**
 * Check if a language is enabled
 * @param {string} code - Language code
 * @returns {boolean} Whether the language is enabled
 */
function isLanguageEnabled(code) {
	return Boolean(ENABLED_LANGUAGES[code]);
}

// Export the main configurations and utility functions
module.exports = {
	// Main exports for i18n setup
	locales: getEnabledLocales(),
	languages: getLanguageSwitcherConfig(),

	// Utility functions
	getEnabledLocales,
	getLanguageSwitcherConfig,
	getLanguageConfig,
	isLanguageEnabled,
	clearCache,

	// For debugging/inspection
	ALL_LANGUAGES,
	ENABLED_LANGUAGES,
};

// Also support ES6 imports
if (typeof exports === "undefined") {
	// Browser environment or ES6 modules
	window.i18nConfig = module.exports;
}
