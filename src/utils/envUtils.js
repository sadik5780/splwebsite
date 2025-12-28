/**
 * Utility to detect if the app is running in a local environment.
 * Checks for localhost, 127.0.0.1, and ::1.
 */
export const isLocalEnvironment = () => {
    const hostname = window.location.hostname;
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]'
    );
};

/**
 * Checks if local data access is explicitly allowed via environment variable.
 */
export const isLocalDataAllowed = () => {
    return process.env.REACT_APP_ALLOW_LOCAL_DATA === 'true';
};

/**
 * Determines if Supabase/R2 access should be enabled.
 * Returns true if:
 * 1. Not a local environment (Production)
 * OR
 * 2. Local environment WITH override enabled
 */
export const shouldEnableCloudServices = () => {
    if (!isLocalEnvironment()) return true; // Always enable in production
    return isLocalDataAllowed(); // Only enable locally if override is true
};
