import type { ApiResponse, AuthResponse, Restaurant, Dish, Order, CreateRestaurantInput, CreateDishInput, CreateOrderInput } from "shared";

const API_BASE = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data: ApiResponse<T> = await res.json();

  if (!data.success) {
    throw new Error(data.error || "Request failed");
  }

  return data.data as T;
}

// Auth
export const api = {
  register: (body: { email: string; password: string; name: string }) =>
    request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  getMe: () => request<{ id: number; email: string; name: string }>("/api/auth/me"),

  // Public
  getRestaurants: () => request<Restaurant[]>("/api/restaurants"),
  getRestaurant: (id: number) => request<Restaurant & { dishes: Dish[] }>(`/api/restaurants/${id}`),

  // My restaurants
  getMyRestaurants: () => request<Restaurant[]>("/api/my/restaurants/mine/list"),
  createRestaurant: (body: CreateRestaurantInput) =>
    request<Restaurant>("/api/my/restaurants", { method: "POST", body: JSON.stringify(body) }),
  updateRestaurant: (id: number, body: Partial<CreateRestaurantInput>) =>
    request<Restaurant>(`/api/my/restaurants/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteRestaurant: (id: number) =>
    request<{ deleted: boolean }>(`/api/my/restaurants/${id}`, { method: "DELETE" }),

  // Dishes
  addDish: (restaurantId: number, body: CreateDishInput) =>
    request<Dish>(`/api/my/restaurants/${restaurantId}/dishes`, { method: "POST", body: JSON.stringify(body) }),
  updateDish: (restaurantId: number, dishId: number, body: Partial<CreateDishInput & { available: boolean }>) =>
    request<Dish>(`/api/my/restaurants/${restaurantId}/dishes/${dishId}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteDish: (restaurantId: number, dishId: number) =>
    request<{ deleted: boolean }>(`/api/my/restaurants/${restaurantId}/dishes/${dishId}`, { method: "DELETE" }),

  // Orders
  placeOrder: (body: CreateOrderInput) =>
    request<Order>("/api/orders", { method: "POST", body: JSON.stringify(body) }),
  getMyOrders: () => request<Order[]>("/api/orders"),
  getOrder: (id: number) => request<Order>(`/api/orders/${id}`),
  getRestaurantOrders: (restaurantId: number) =>
    request<Order[]>(`/api/orders/restaurant/${restaurantId}`),
  updateOrderStatus: (id: number, status: string) =>
    request<{ id: number; status: string }>(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};
