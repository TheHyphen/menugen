import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Restaurant } from "shared";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRestaurants().then(setRestaurants).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading restaurants...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Restaurants</h1>
      {restaurants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No restaurants yet. Be the first to add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{r.name}</CardTitle>
                {r.description && <CardDescription>{r.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                {r.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                    <MapPin className="h-3 w-3" />
                    {r.address}
                  </p>
                )}
                <Button asChild className="w-full">
                  <Link to={`/restaurants/${r.id}`}>View Menu</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
