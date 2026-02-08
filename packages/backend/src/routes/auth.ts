import { Hono } from "hono";
import { createToken, hashPassword, verifyPassword } from "../auth";
import type { Bindings, Variables } from "../types";
import type { RegisterInput, LoginInput } from "shared";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

auth.post("/register", async (c) => {
  const body = await c.req.json<RegisterInput>();

  if (!body.email || !body.password || !body.name) {
    return c.json({ success: false, error: "Email, password, and name are required" }, 400);
  }

  if (body.password.length < 6) {
    return c.json({ success: false, error: "Password must be at least 6 characters" }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?")
    .bind(body.email.toLowerCase())
    .first();

  if (existing) {
    return c.json({ success: false, error: "Email already registered" }, 409);
  }

  const passwordHash = await hashPassword(body.password);

  const result = await c.env.DB.prepare(
    "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)"
  )
    .bind(body.email.toLowerCase(), passwordHash, body.name)
    .run();

  const userId = result.meta.last_row_id as number;
  const token = await createToken(userId, c.env.JWT_SECRET);

  return c.json({
    success: true,
    data: {
      token,
      user: { id: userId, email: body.email.toLowerCase(), name: body.name, created_at: new Date().toISOString() },
    },
  }, 201);
});

auth.post("/login", async (c) => {
  const body = await c.req.json<LoginInput>();

  if (!body.email || !body.password) {
    return c.json({ success: false, error: "Email and password are required" }, 400);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?"
  )
    .bind(body.email.toLowerCase())
    .first<{ id: number; email: string; name: string; password_hash: string; created_at: string }>();

  if (!user) {
    return c.json({ success: false, error: "Invalid email or password" }, 401);
  }

  const valid = await verifyPassword(body.password, user.password_hash);
  if (!valid) {
    return c.json({ success: false, error: "Invalid email or password" }, 401);
  }

  const token = await createToken(user.id, c.env.JWT_SECRET);

  return c.json({
    success: true,
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name, created_at: user.created_at },
    },
  });
});

auth.get("/me", async (c) => {
  // This route expects authMiddleware to have run
  const userId = c.get("userId");
  const user = await c.env.DB.prepare(
    "SELECT id, email, name, created_at FROM users WHERE id = ?"
  )
    .bind(userId)
    .first();

  if (!user) {
    return c.json({ success: false, error: "User not found" }, 404);
  }

  return c.json({ success: true, data: user });
});

export default auth;
