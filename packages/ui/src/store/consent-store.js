export const createConsentSlice = (set, get) => ({
	// Consent levels
	// NOTE: Functional cookies are always true (required for basic site functionality)
	consent_performance: false,
	consent_functional: true, // Always true - required cookies
	consent_targeting: false,
	consent_initialized: false,

	// Actions
	setPerformanceConsent: (accepted) =>
		set({
			consent_performance: accepted,
		}),

	// Functional consent cannot be changed - always true
	setFunctionalConsent: (accepted) =>
		set({
			consent_functional: true, // Always true regardless of input
		}),

	setTargetingConsent: (accepted) =>
		set({
			consent_targeting: accepted,
		}),

	setConsentInitialized: (initialized) =>
		set({
			consent_initialized: initialized,
		}),

	acceptAllConsent: () =>
		set({
			consent_performance: true,
			consent_functional: true,
			consent_targeting: true,
			consent_initialized: true,
		}),

	rejectAllConsent: () =>
		set({
			consent_performance: false,
			consent_functional: true, // Always true
			consent_targeting: false,
			consent_initialized: true,
		}),

	resetConsent: () =>
		set({
			consent_performance: false,
			consent_functional: true, // Always true
			consent_targeting: false,
			consent_initialized: false,
		}),
});
