import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { RestaurantsPage } from "@/pages/restaurants";
import { RestaurantDetailPage } from "@/pages/restaurant-detail";
import { MyRestaurantsPage } from "@/pages/my-restaurants";
import { ManageDishesPage } from "@/pages/manage-dishes";
import { MyOrdersPage } from "@/pages/my-orders";
import { OrderDetailPage } from "@/pages/order-detail";
import { RestaurantOrdersPage } from "@/pages/restaurant-orders";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/restaurants" element={<RestaurantsPage />} />
            <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
            <Route
              path="/my/restaurants"
              element={
                <ProtectedRoute>
                  <MyRestaurantsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/restaurants/:restaurantId/dishes"
              element={
                <ProtectedRoute>
                  <ManageDishesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/restaurants/:restaurantId/orders"
              element={
                <ProtectedRoute>
                  <RestaurantOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/orders"
              element={
                <ProtectedRoute>
                  <MyOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
