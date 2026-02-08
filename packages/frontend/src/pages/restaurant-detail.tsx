import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Restaurant, Dish } from "shared";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { MapPin, Minus, Plus, ShoppingBag } from "lucide-react";

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<(Restaurant & { dishes: Dish[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (id) {
      api.getRestaurant(Number(id)).then(setRestaurant).finally(() => setLoading(false));
    }
  }, [id]);

  const addToCart = (dishId: number) => {
    setCart((prev) => ({ ...prev, [dishId]: (prev[dishId] || 0) + 1 }));
  };

  const removeFromCart = (dishId: number) => {
    setCart((prev) => {
      const count = (prev[dishId] || 0) - 1;
      if (count <= 0) {
        const { [dishId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [dishId]: count };
    });
  };

  const cartTotal = restaurant
    ? Object.entries(cart).reduce((sum, [dishId, qty]) => {
        const dish = restaurant.dishes.find((d) => d.id === Number(dishId));
        return sum + (dish ? dish.price * qty : 0);
      }, 0)
    : 0;

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const placeOrder = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!restaurant || cartItemCount === 0) return;

    setOrdering(true);
    try {
      const items = Object.entries(cart).map(([dishId, quantity]) => ({
        dish_id: Number(dishId),
        quantity,
      }));
      await api.placeOrder({ restaurant_id: restaurant.id, items });
      setCart({});
      navigate("/my/orders");
    } catch (err: any) {
      alert(err.message || "Failed to place order");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!restaurant) {
    return <div className="text-center py-12 text-muted-foreground">Restaurant not found</div>;
  }

  // Group dishes by category
  const categories = restaurant.dishes.reduce<Record<string, Dish[]>>((acc, dish) => {
    if (!dish.available) return acc;
    const cat = dish.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        {restaurant.description && (
          <p className="text-muted-foreground mt-2">{restaurant.description}</p>
        )}
        {restaurant.address && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3" />
            {restaurant.address}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {Object.keys(categories).length === 0 ? (
            <p className="text-muted-foreground">No dishes available yet.</p>
          ) : (
            Object.entries(categories).map(([category, dishes]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-4">{category}</h2>
                <div className="space-y-3">
                  {dishes.map((dish) => (
                    <Card key={dish.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1">
                          <h3 className="font-medium">{dish.name}</h3>
                          {dish.description && (
                            <p className="text-sm text-muted-foreground">{dish.description}</p>
                          )}
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatPrice(dish.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {cart[dish.id] ? (
                            <>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeFromCart(dish.id)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{cart[dish.id]}</span>
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addToCart(dish.id)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => addToCart(dish.id)}>
                              Add
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Your Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItemCount === 0 ? (
                <p className="text-sm text-muted-foreground">Your cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(cart).map(([dishId, qty]) => {
                    const dish = restaurant.dishes.find((d) => d.id === Number(dishId));
                    if (!dish) return null;
                    return (
                      <div key={dishId} className="flex justify-between text-sm">
                        <span>
                          {dish.name} x{qty}
                        </span>
                        <span className="font-medium">{formatPrice(dish.price * qty)}</span>
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <Button className="w-full mt-4" onClick={placeOrder} disabled={ordering}>
                    {ordering ? "Placing order..." : user ? "Place Order" : "Log in to Order"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
