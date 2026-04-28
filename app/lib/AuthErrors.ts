export const AUTH_ERRORS: Record<string, { title: string; message: string }> = {
    // ── Register ──────────────────────────────────────────────────────────────
    USER_EXISTS: {
        title: 'Account already exists',
        message: 'An account with this email already exists. Try logging in instead.',
    },
    INVALID_EMAIL_FORMAT: {
        title: 'Invalid email',
        message: 'Please enter a valid email address.',
    },
    PASSWORD_TOO_SHORT: {
        title: 'Password too short',
        message: 'Your password must be at least 6 characters.',
    },
    NAME_REQUIRED: {
        title: 'Name required',
        message: 'Please enter your name to continue.',
    },
    TERMS_NOT_AGREED: {
        title: 'Terms not accepted',
        message: 'Please agree to our terms and conditions before creating your account.',
    },

    // ── Login ─────────────────────────────────────────────────────────────────
    EMAIL_NOT_FOUND: {
        title: 'Account not found',
        message: 'No account found with this email. Check the address or sign up.',
    },
    WRONG_PASSWORD: {
        title: 'Incorrect password',
        message: "That password doesn't match. Please try again.",
    },

    // ── Generic ───────────────────────────────────────────────────────────────
    UNKNOWN: {
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try again.',
    },
    CANNOT_FAVORITE_OWN_HOME: {
        title: 'Action not allowed',
        message: "You cannot favorite your own listing.",
    },
};

export const getAuthError = (code: string): { title: string; message: string } =>
    AUTH_ERRORS[code] ?? AUTH_ERRORS.UNKNOWN;