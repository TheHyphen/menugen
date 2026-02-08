import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import type { CreateRestaurantInput } from "shared";

const restaurants = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// List all restaurants
restaurants.get("/", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, owner_id, name, description, address, created_at FROM restaurants ORDER BY created_at DESC"
  ).all();

  return c.json({ success: true, data: rows.results });
});

// Get single restaurant with its dishes
restaurants.get("/:id", async (c) => {
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

  return c.json({
    success: true,
    data: { ...restaurant, dishes: dishes.results },
  });
});

// Create restaurant (auth required - userId set by middleware)
restaurants.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<CreateRestaurantInput>();

  if (!body.name) {
    return c.json({ success: false, error: "Restaurant name is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO restaurants (owner_id, name, description, address) VALUES (?, ?, ?, ?)"
  )
    .bind(userId, body.name, body.description || "", body.address || "")
    .run();

  const id = result.meta.last_row_id as number;
  return c.json({
    success: true,
    data: {
      id,
      owner_id: userId,
      name: body.name,
      description: body.description || "",
      address: body.address || "",
      created_at: new Date().toISOString(),
    },
  }, 201);
});

// Update restaurant (owner only)
restaurants.put("/:id", async (c) => {
  const userId = c.get("userId");
  const id = Number(c.req.param("id"));
  const body = await c.req.json<Partial<CreateRestaurantInput>>();

  const restaurant = await c.env.DB.prepare(
    "SELECT owner_id FROM restaurants WHERE id = ?"
  )
    .bind(id)
    .first<{ owner_id: number }>();

  if (!restaurant) {
    return c.json({ success: false, error: "Restaurant not found" }, 404);
  }
  if (restaurant.owner_id !== userId) {
    return c.json({ success: false, error: "Not authorized" }, 403);
  }

  await c.env.DB.prepare(
    "UPDATE restaurants SET name = COALESCE(?, name), description = COALESCE(?, description), address = COALESCE(?, address) WHERE id = ?"
  )
    .bind(body.name ?? null, body.description ?? null, body.address ?? null, id)
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT id, owner_id, name, description, address, created_at FROM restaurants WHERE id = ?"
  )
    .bind(id)
    .first();

  return c.json({ success: true, data: updated });
});

// Delete restaurant (owner only)
restaurants.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = Number(c.req.param("id"));

  const restaurant = await c.env.DB.prepare(
    "SELECT owner_id FROM restaurants WHERE id = ?"
  )
    .bind(id)
    .first<{ owner_id: number }>();

  if (!restaurant) {
    return c.json({ success: false, error: "Restaurant not found" }, 404);
  }
  if (restaurant.owner_id !== userId) {
    return c.json({ success: false, error: "Not authorized" }, 403);
  }

  await c.env.DB.prepare("DELETE FROM dishes WHERE restaurant_id = ?").bind(id).run();
  await c.env.DB.prepare("DELETE FROM restaurants WHERE id = ?").bind(id).run();

  return c.json({ success: true, data: { deleted: true } });
});

// Get my restaurants
restaurants.get("/mine/list", async (c) => {
  const userId = c.get("userId");

  const rows = await c.env.DB.prepare(
    "SELECT id, owner_id, name, description, address, created_at FROM restaurants WHERE owner_id = ? ORDER BY created_at DESC"
  )
    .bind(userId)
    .all();

  return c.json({ success: true, data: rows.results });
});

export default restaurants;
