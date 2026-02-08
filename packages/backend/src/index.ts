import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Bindings, Variables } from "./types";
import { authMiddleware } from "./middleware";
import authRoutes from "./routes/auth";
import restaurantRoutes from "./routes/restaurants";
import dishRoutes from "./routes/dishes";
import orderRoutes from "./routes/orders";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Health check
app.get("/", (c) => c.json({ status: "ok", service: "menugen-api" }));

// Public auth routes
app.route("/api/auth", authRoutes);

// Public restaurant listing
app.get("/api/restaurants", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, owner_id, name, description, address, created_at FROM restaurants ORDER BY created_at DESC"
  ).all();
  return c.json({ success: true, data: rows.results });
});

app.get("/api/restaurants/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const restaurant = await c.env.DB.prepare(
    "SELECT id, owner_id, name, description, address, created_at FROM restaurants WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!restaurant) {
    return c.json({ success: false, error: "Restaurant not found" }, 404);
  }
  const dishes = await c.env.DB.prepare(
    "SELECT id, restaurant_id, name, description, price, category, available, created_at FROM dishes WHERE restaurant_id = ? ORDER BY category, name"
  )
    .bind(id)
    .all();
  return c.json({ success: true, data: { ...restaurant, dishes: dishes.results } });
});

// Protected routes
app.use("/api/auth/me", authMiddleware);
app.use("/api/my/*", authMiddleware);
app.use("/api/orders/*", authMiddleware);

// Protected restaurant routes
app.route("/api/my/restaurants", restaurantRoutes);

// Protected dish routes (nested under restaurants)
app.route("/api/my/restaurants", dishRoutes);

// Order routes
app.route("/api/orders", orderRoutes);

export default app;
