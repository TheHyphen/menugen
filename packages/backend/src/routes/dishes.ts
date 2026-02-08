import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import type { CreateDishInput } from "shared";

const dishes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Add dish to restaurant (owner only)
dishes.post("/:restaurantId/dishes", async (c) => {
  const userId = c.get("userId");
  const restaurantId = Number(c.req.param("restaurantId"));
  const body = await c.req.json<CreateDishInput>();

  const restaurant = await c.env.DB.prepare(
    "SELECT owner_id FROM restaurants WHERE id = ?"
  )
    .bind(restaurantId)
    .first<{ owner_id: number }>();

  if (!restaurant) {
    return c.json({ success: false, error: "Restaurant not found" }, 404);
  }
  if (restaurant.owner_id !== userId) {
    return c.json({ success: false, error: "Not authorized" }, 403);
  }

  if (!body.name || body.price == null) {
    return c.json({ success: false, error: "Name and price are required" }, 400);
  }

  const result = await c.env.DB.prepare(
    "INSERT INTO dishes (restaurant_id, name, description, price, category) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(restaurantId, body.name, body.description || "", body.price, body.category || "Main")
    .run();

  const id = result.meta.last_row_id as number;
  return c.json({
    success: true,
    data: {
      id,
      restaurant_id: restaurantId,
      name: body.name,
      description: body.description || "",
      price: body.price,
      category: body.category || "Main",
      available: true,
      created_at: new Date().toISOString(),
    },
  }, 201);
});

// Update dish (owner only)
dishes.put("/:restaurantId/dishes/:dishId", async (c) => {
  const userId = c.get("userId");
  const restaurantId = Number(c.req.param("restaurantId"));
  const dishId = Number(c.req.param("dishId"));

  const restaurant = await c.env.DB.prepare(
    "SELECT owner_id FROM restaurants WHERE id = ?"
  )
    .bind(restaurantId)
    .first<{ owner_id: number }>();

  if (!restaurant) {
    return c.json({ success: false, error: "Restaurant not found" }, 404);
  }
  if (restaurant.owner_id !== userId) {
    return c.json({ success: false, error: "Not authorized" }, 403);
  }

  const body = await c.req.json<Partial<CreateDishInput & { available: boolean }>>();

  await c.env.DB.prepare(
    `UPDATE dishes SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      category = COALESCE(?, category),
      available = COALESCE(?, available)
    WHERE id = ? AND restaurant_id = ?`
  )
    .bind(
      body.name ?? null,
      body.description ?? null,
      body.price ?? null,
      body.category ?? null,
      body.available != null ? (body.available ? 1 : 0) : null,
      dishId,
      restaurantId
    )
    .run();

  const updated = await c.env.DB.prepare(
    "SELECT id, restaurant_id, name, description, price, category, available, created_at FROM dishes WHERE id = ?"
  )
    .bind(dishId)
    .first();

  return c.json({ success: true, data: updated });
});

// Delete dish (owner only)
dishes.delete("/:restaurantId/dishes/:dishId", async (c) => {
  const userId = c.get("userId");
  const restaurantId = Number(c.req.param("restaurantId"));
  const dishId = Number(c.req.param("dishId"));

  const restaurant = await c.env.DB.prepare(
    "SELECT owner_id FROM restaurants WHERE id = ?"
  )
    .bind(restaurantId)
    .first<{ owner_id: number }>();

  if (!restaurant) {
    return c.json({ success: false, error: "Restaurant not found" }, 404);
  }
  if (restaurant.owner_id !== userId) {
    return c.json({ success: false, error: "Not authorized" }, 403);
  }

  await c.env.DB.prepare("DELETE FROM dishes WHERE id = ? AND restaurant_id = ?")
    .bind(dishId, restaurantId)
    .run();

  return c.json({ success: true, data: { deleted: true } });
});

export default dishes;
