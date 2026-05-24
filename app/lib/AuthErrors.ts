import i18next from "../../Services/i18next";

export const AUTH_ERRORS: Record<string, { titleKey: string; messageKey: string }> = {
    // ── Validation / server message strings (from http.ts responses) ──────────
    "All fields are required": {
        titleKey: "authErrors.missingFieldsTitle",
        messageKey: "authErrors.missingFieldsMessage",
    },
    "Invalid email format": {
        titleKey: "authErrors.invalidEmailTitle",
        messageKey: "authErrors.invalidEmailMessage",
    },
    "Password must be at least 8 characters": {
        titleKey: "authErrors.passwordShortTitle",
        messageKey: "authErrors.passwordShortMessage",
    },
    "User already exists": {
        titleKey: "authErrors.accountExistsTitle",
        messageKey: "authErrors.accountExistsMessage",
    },
    "Invalid email or password": {
        titleKey: "authErrors.incorrectCredentialsTitle",
        messageKey: "authErrors.incorrectCredentialsMessage",
    },
    "Email and password are required": {
        titleKey: "authErrors.missingEmailPasswordTitle",
        messageKey: "authErrors.missingEmailPasswordMessage",
    },

    // ── Code keys (from http.ts `code` field & Convex errors) ────────────────
    "MISSING_FIELDS": {
        titleKey: "authErrors.missingFieldsTitle",
        messageKey: "authErrors.missingFieldsMessage",
    },
    "INVALID_EMAIL": {
        titleKey: "authErrors.invalidEmailTitle",
        messageKey: "authErrors.invalidEmailMessage",
    },
    "WEAK_PASSWORD": {
        titleKey: "authErrors.passwordShortTitle",
        messageKey: "authErrors.passwordShortMessage",
    },
    "USER_EXISTS": {
        titleKey: "authErrors.accountExistsTitle",
        messageKey: "authErrors.accountExistsMessageSimple",
    },
    "USER_NOT_FOUND": {
        titleKey: "authErrors.userNotFoundTitle",
        messageKey: "authErrors.userNotFoundMessage",
    },
    "UNAUTHORIZED": {
        titleKey: "authErrors.unauthorizedTitle",
        messageKey: "authErrors.unauthorizedMessage",
    },
    "INVALID_AGE": {
        titleKey: "authErrors.invalidAgeTitle",
        messageKey: "authErrors.invalidAgeMessage",
    },
    "IMAGE_REQUIRED": {
        titleKey: "authErrors.missingImageTitle",
        messageKey: "authErrors.missingImageMessage",
    },
    "INVALID_DETAILS_COUNT": {
        titleKey: "authErrors.invalidDetailsCountTitle",
        messageKey: "authErrors.invalidDetailsCountMessage",
    },
    "PRICE_TOO_LOW": {
        titleKey: "authErrors.priceTooLowTitle",
        messageKey: "authErrors.priceTooLowMessage",
    },
    "HOME_NOT_FOUND": {
        titleKey: "authErrors.homeNotFoundTitle",
        messageKey: "authErrors.homeNotFoundMessage",
    },
    "CANNOT_MESSAGE_SELF": {
        titleKey: "authErrors.cannotMessageSelfTitle",
        messageKey: "authErrors.cannotMessageSelfMessage",
    },
    "MESSAGE_CONTENT_REQUIRED": {
        titleKey: "authErrors.emptyMessageTitle",
        messageKey: "authErrors.emptyMessageMessage",
    },
    "RECEIVER_NOT_FOUND": {
        titleKey: "authErrors.receiverNotFoundTitle",
        messageKey: "authErrors.receiverNotFoundMessage",
    },
    "NOTIFICATION_NOT_FOUND": {
        titleKey: "authErrors.notificationNotFoundTitle",
        messageKey: "authErrors.notificationNotFoundMessage",
    },
    "CANNOT_FAVORITE_OWN_HOME": {
        titleKey: "authErrors.actionNotAllowedTitle",
        messageKey: "authErrors.cannotFavoriteOwnHomeMessage",
    },
    // ── Auth flow specific ────────────────────────────────────────────────────
    "TERMS_NOT_AGREED": {
        titleKey: "authErrors.termsNotAgreedTitle",
        messageKey: "authErrors.termsNotAgreedMessage",
    },
    "NETWORK_ERROR": {
        titleKey: "authErrors.networkErrorTitle",
        messageKey: "authErrors.networkErrorMessage",
    },
    "SERVER_ERROR": {
        titleKey: "authErrors.serverErrorTitle",
        messageKey: "authErrors.serverErrorMessage",
    },
    // ── Generic fallback ──────────────────────────────────────────────────────
    "UNKNOWN": {
        titleKey: "authErrors.somethingWentWrongTitle",
        messageKey: "authErrors.somethingWentWrongMessage",
    },
};

export const getAuthError = (code: string): { title: string; message: string } => {
    if (!code) {
        return {
            title: i18next.t(AUTH_ERRORS.UNKNOWN.titleKey),
            message: i18next.t(AUTH_ERRORS.UNKNOWN.messageKey),
        };
    }

    const codeStr = String(code);

    // 1. Exact match first
    let errorObj = AUTH_ERRORS[codeStr];

    // 2. Substring match for Convex-wrapped errors like:
    //    "[CONVEX M(...)] ConvexError: CANNOT_FAVORITE_OWN_HOME"
    if (!errorObj) {
        for (const key of Object.keys(AUTH_ERRORS)) {
            if (codeStr.includes(key)) {
                errorObj = AUTH_ERRORS[key];
                break;
            }
        }
    }

    // 3. Final fallback
    if (!errorObj) {
        errorObj = AUTH_ERRORS.UNKNOWN;
    }

    return {
        title: i18next.t(errorObj.titleKey),
        message: i18next.t(errorObj.messageKey),
    };
};