
/**
 * convex/http.ts
 *
 * "use node" is REQUIRED — bcryptjs and jose need Node.js built-ins
 * (crypto, Buffer) which are unavailable in Convex's default V8 isolate.
 * Without this directive Convex will NOT register the HTTP routes.
 */

import bcrypt from "bcryptjs";
import { httpRouter } from "convex/server";
import { SignJWT, jwtVerify } from "jose";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET ?? "change-me-in-production"
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function signToken(userId: string): Promise<string> {
    return new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(JWT_SECRET);
}

export async function verifyToken(
    token: string
): Promise<{ userId: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { userId: string };
    } catch {
        return null;
    }
}

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
const registerHandler = httpAction(async (ctx, req) => {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
        return json({ message: "All fields are required", code: "MISSING_FIELDS" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ message: "Invalid email format", code: "INVALID_EMAIL" }, 400);
    }
    if (password.length < 6) {
        return json({ message: "Password must be at least 6 characters", code: "WEAK_PASSWORD" }, 400);
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    let result: { userId: string; messageId?: string };
    try {
        result = await ctx.runMutation(api.users.register, {
            name,
            email,
            password: hashedPassword,
            role,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Convex wraps errors: "[CONVEX M(...)] ConvexError: USER_EXISTS"
        if (msg.includes("USER_EXISTS")) {
            return json({ message: "User already exists", code: "USER_EXISTS" }, 400);
        }
        console.error("[http] register error:", msg);
        return json({ message: "Something went wrong", code: "UNKNOWN" }, 500);
    }

    const token = await signToken(result.userId);
    const user = await ctx.runQuery(api.users.getById, { userId: result.userId as never });

    return json({ message: "User created successfully", user, token }, 201);
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const loginHandler = httpAction(async (ctx, req) => {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
        return json({ message: "Email and password are required", code: "MISSING_FIELDS" }, 400);
    }

    const user = await ctx.runQuery(api.users.getUserByEmail, { email });
    if (!user) return json({ message: "Invalid email or password", code: "Invalid email or password" }, 400);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return json({ message: "Invalid email or password", code: "Invalid email or password" }, 400);

    const token = await signToken(user._id);
    const { password: _pw, ...safeUser } = user;

    return json({ message: "Sign in successful", user: safeUser, token });
});

// ─── SEND PUSH NOTIFICATION ───────────────────────────────────────────────────
/**
 * Called by mutations to send push notifications to users via Expo
 */
const sendPushNotificationHandler = httpAction(async (ctx, req) => {
    const body = await req.json();
    const { userId, title, body: notificationBody, data } = body;

    if (!userId || !title || !notificationBody) {
        return json(
            { message: "userId, title, and body are required", code: "MISSING_FIELDS" },
            400
        );
    }

    try {
        // Get user's expo token
        const user = await ctx.runQuery(api.users.getById, { userId });
        if (!user?.ExpoPushToken) {
            return json(
                { message: "User has no push token", code: "NO_TOKEN" },
                400
            );
        }

        // Send to Expo Push API
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Accept": "application/json" },
            body: JSON.stringify({
                to: user.ExpoPushToken,
                sound: "default",
                title,
                body: notificationBody,
                data: data || {},
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            // console.error("[push] Expo API error:", result);
            return json(
                { message: "Failed to send notification", code: "EXPO_ERROR", error: result },
                500
            );
        }

        return json({ message: "Notification sent successfully", ticket: result }, 200);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        // console.error("[push] send error:", msg);
        return json(
            { message: "Failed to send notification", code: "UNKNOWN", error: msg },
            500
        );
    }
});

// ─── ROUTER ───────────────────────────────────────────────────────────────────
const http = httpRouter();

http.route({ path: "/api/v1/user/register", method: "POST", handler: registerHandler });
http.route({ path: "/api/v1/user/login",    method: "POST", handler: loginHandler });
http.route({ path: "/api/v1/notifications/send", method: "POST", handler: sendPushNotificationHandler });

// OPTIONS preflight (mobile clients may send these)
http.route({
    path: "/api/v1/user/register",
    method: "OPTIONS",
    handler: httpAction(async () =>
        new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        })
    ),
});

http.route({
    path: "/api/v1/user/login",
    method: "OPTIONS",
    handler: httpAction(async () =>
        new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        })
    ),
});

export default http;