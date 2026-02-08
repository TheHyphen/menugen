import { Context, Next } from "hono";
import { verifyToken } from "./auth";
import type { Bindings, Variables } from "./types";

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice(7);
  const userId = await verifyToken(token, c.env.JWT_SECRET);
  if (!userId) {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }

  c.set("userId", userId);
  await next();
}
