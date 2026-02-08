import { Hono } from "hono";
import type { Bindings, Variables } from "../types";
import type { CreateOrderInput } from "shared";

const orders = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Place order
orders.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<CreateOrderInput>();

  if (!body.restaurant_id || !body.items?.length) {
    return c.json({ success: false, error: "Restaurant and items are required" }, 400);
  }

  // Verify restaurant exists
  const restaurant = await c.env.DB.prepare(
    "SELECT id, name FROM restaurants WHERE id = ?"
  )
    .bind(body.restaurant_id)
    .first<{ id: number; name: string }>();

  if (!restaurant) {
    return c.json({ success: false, error: "Restaurant not found" }, 404);
  }

  // Fetch dish prices and validate
  const dishIds = body.items.map((i) => i.dish_id);
  const placeholders = dishIds.map(() => "?").join(",");
  const dishRows = await c.env.DB.prepare(
    `SELECT id, name, price, available FROM dishes WHERE id IN (${placeholders}) AND restaurant_id = ?`
  )
    .bind(...dishIds, body.restaurant_id)
    .all<{ id: number; name: string; price: number; available: number }>();

  const dishMap = new Map(dishRows.results.map((d) => [d.id, d]));

  // Validate all dishes exist and are available
  for (const item of body.items) {
    const dish = dishMap.get(item.dish_id);
    if (!dish) {
      return c.json({ success: false, error: `Dish ${item.dish_id} not found in this restaurant` }, 400);
    }
    if (!dish.available) {
      return c.json({ success: false, error: `${dish.name} is not available` }, 400);
    }
  }

  // Calculate total
  let total = 0;
  for (const item of body.items) {
    const dish = dishMap.get(item.dish_id)!;
    total += dish.price * item.quantity;
  }
  total = Math.round(total * 100) / 100;

  // Create order
  const orderResult = await c.env.DB.prepare(
    "INSERT INTO orders (user_id, restaurant_id, status, total) VALUES (?, ?, 'pending', ?)"
  )
    .bind(userId, body.restaurant_id, total)
    .run();

  const orderId = orderResult.meta.last_row_id as number;

  // Insert order items
  const stmts = body.items.map((item) => {
    const dish = dishMap.get(item.dish_id)!;
    return c.env.DB.prepare(
      "INSERT INTO order_items (order_id, dish_id, quantity, price) VALUES (?, ?, ?, ?)"
    ).bind(orderId, item.dish_id, item.quantity, dish.price);
  });

  await c.env.DB.batch(stmts);

  // Fetch items for response
  const items = body.items.map((item) => {
    const dish = dishMap.get(item.dish_id)!;
    return {
      dish_id: item.dish_id,
      dish_name: dish.name,
      quantity: item.quantity,
      price: dish.price,
    };
  });

  return c.json({
    success: true,
    data: {
      id: orderId,
      user_id: userId,
      restaurant_id: body.restaurant_id,
      restaurant_name: restaurant.name,
      status: "pending",
      total,
      items,
      created_at: new Date().toISOString(),
    },
  }, 201);
});

// Get my orders
orders.get("/", async (c) => {
  const userId = c.get("userId");

  const rows = await c.env.DB.prepare(
    `SELECT o.id, o.user_id, o.restaurant_id, r.name as restaurant_name, o.status, o.total, o.created_at
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`
  )
    .bind(userId)
    .all();

  return c.json({ success: true, data: rows.results });
});

// Get single order with items
orders.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = Number(c.req.param("id"));

  const order = await c.env.DB.prepare(
    `SELECT o.id, o.user_id, o.restaurant_id, r.name as restaurant_name, o.status, o.total, o.created_at
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = ? AND o.user_id = ?`
  )
    .bind(id, userId)
    .first();

  if (!order) {
    return c.json({ success: false, error: "Order not found" }, 404);
  }

  const items = await c.env.DB.prepare(
    `SELECT oi.id, oi.order_id, oi.dish_id, d.name as dish_name, oi.quantity, oi.price
     FROM order_items oi
     JOIN dishes d ON d.id = oi.dish_id
     WHERE oi.order_id = ?`
  )
    .bind(id)
    .all();

  return c.json({
    success: true,
    data: { ...order, items: items.results },
  });
});

// Update order status (restaurant owner only)
orders.patch("/:id/status", async (c) => {
  const userId = c.get("userId");
  const id = Number(c.req.param("id"));
  const { status } = await c.req.json<{ status: string }>();

  const validStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return c.json({ success: false, error: "Invalid status" }, 400);
  }

  // Check if user is the restaurant owner
  const order = await c.env.DB.prepare(
    `SELECT o.id, o.restaurant_id, r.owner_id
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.id = ?`
  )
    .bind(id)
    .first<{ id: number; restaurant_id: number; owner_id: number }>();

  if (!order) {
    return c.json({ success: false, error: "Order not found" }, 404);
  }
  if (order.owner_id !== userId) {
    return c.json({ success: false, error: "Not authorized" }, 403);
  }

  await c.env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();

  return c.json({ success: true, data: { id, status } });
});

// Get orders for my restaurant
orders.get("/restaurant/:restaurantId", async (c) => {
  const userId = c.get("userId");
  const restaurantId = Number(c.req.param("restaurantId"));

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

  const rows = await c.env.DB.prepare(
    `SELECT o.id, o.user_id, o.restaurant_id, o.status, o.total, o.created_at
     FROM orders o
     WHERE o.restaurant_id = ?
     ORDER BY o.created_at DESC`
  )
    .bind(restaurantId)
    .all();

  return c.json({ success: true, data: rows.results });
});

export default orders;
