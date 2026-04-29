export const AUTH_ERRORS: Record<string, { title: string; message: string }> = {
    "All fields are required": {
        title: "Missing fields",
        message: "Please fill in all required fields.",
    },
    "Invalid email format": {
        title: "Invalid email",
        message: "Please enter a valid email address.",
    },
    "Password must be at least 8 characters": {
        title: "Password too short",
        message: "Your password must be at least 8 characters.",
    },
    "User already exists": {
        title: "Account already exists",
        message: "An account with this email already exists. Try logging in instead.",
    },
    "Invalid email or password": {
        title: "Incorrect credentials",
        message: "The email or password you entered is incorrect. Please try again.",
    },
    "Email and password are required": {
        title: "Missing fields",
        message: "Please enter your email and password.",
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