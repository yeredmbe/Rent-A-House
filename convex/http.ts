/**
 * convex/http.ts
 *
 * Thin HTTP layer that replaces your Express server for auth endpoints.
 * Password hashing and JWT signing happen here (Convex actions support Node.js
 * built-ins via "use node" directive).
 *
 * All other data operations use Convex mutations/queries directly from the
 * React Native client — no HTTP needed.
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
    const { name, email, password, role, ExpoPushToken } = body;

    if (!name || !email || !password) {
        return json({ message: "All fields are required" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ message: "Invalid email format" }, 400);
    }
    if (password.length < 8) {
        return json({ message: "Password must be at least 8 characters" }, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let result: { userId: string; messageId?: string };
    try {
        result = await ctx.runMutation(api.users.register, {
            name,
            email,
            hashedPassword,
            role,
            // ExpoPushToken,
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "USER_EXISTS") {
            return json({ message: "User already exists" }, 400);
        }
        throw err;
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
        return json({ message: "Email and password are required" }, 400);
    }

    const user = await ctx.runQuery(api.users.getUserByEmail, { email });
    if (!user) return json({ message: "Invalid email or password" }, 400);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return json({ message: "Invalid email or password" }, 400);

    const token = await signToken(user._id);
    const { password: _pw, ...safeUser } = user;

    return json({ message: "Sign in successful", user: safeUser, token });
});

// ─── ROUTER ───────────────────────────────────────────────────────────────────
const http = httpRouter();

http.route({ path: "/api/v1/user/register", method: "POST", handler: registerHandler });
http.route({ path: "/api/v1/user/login", method: "POST", handler: loginHandler });

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