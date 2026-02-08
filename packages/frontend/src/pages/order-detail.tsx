import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Order } from "shared";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getOrder(Number(id)).then(setOrder).finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-12 text-muted-foreground">Order not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/my/orders">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back to Orders
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order #{order.id}</CardTitle>
            <Badge>{order.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {order.restaurant_name} &middot; {formatDate(order.created_at)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.dish_name} x{item.quantity}
                </span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
