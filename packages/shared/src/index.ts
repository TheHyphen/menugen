// ---- Users ----
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ---- Restaurants ----
export interface Restaurant {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  address: string;
  created_at: string;
}

export interface CreateRestaurantInput {
  name: string;
  description: string;
  address: string;
}

// ---- Dishes ----
export interface Dish {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  created_at: string;
}

export interface CreateDishInput {
  name: string;
  description: string;
  price: number;
  category: string;
}

// ---- Orders ----
export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  restaurant_name?: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  items?: OrderItem[];
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";

export interface OrderItem {
  id: number;
  order_id: number;
  dish_id: number;
  dish_name?: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  restaurant_id: number;
  items: { dish_id: number; quantity: number }[];
}

// ---- API Response ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
