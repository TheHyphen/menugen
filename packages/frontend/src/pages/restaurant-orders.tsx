import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Order } from "shared";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const ALL_STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

export function RestaurantOrdersPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (restaurantId) {
      api.getRestaurantOrders(Number(restaurantId)).then(setOrders).finally(() => setLoading(false));
    }
  };

  useEffect(load, [restaurantId]);

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/my/restaurants">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to Restaurants
        </Link>
      </Button>
      <h1 className="text-3xl font-bold mb-6">Incoming Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No orders yet for this restaurant.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">Order #{order.id}</h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(order.total)}</p>
                    <Badge>{order.status}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.filter((s) => s !== order.status).map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(order.id, status)}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
