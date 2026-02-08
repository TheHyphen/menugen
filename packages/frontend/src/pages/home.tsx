import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { UtensilsCrossed, Store, ShoppingBag, ChefHat } from "lucide-react";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center text-center gap-8 py-12">
      <div className="flex flex-col items-center gap-4">
        <UtensilsCrossed className="h-16 w-16 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to MenuGen
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          Create your restaurant, manage your menu, and let customers order
          their favorite dishes. All in one place.
        </p>
      </div>

      <div className="flex gap-4">
        <Button size="lg" asChild>
          <Link to="/restaurants">Browse Restaurants</Link>
        </Button>
        {!user && (
          <Button size="lg" variant="outline" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 w-full max-w-4xl">
        <div className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card">
          <Store className="h-10 w-10 text-primary" />
          <h3 className="font-semibold text-lg">Add Your Restaurant</h3>
          <p className="text-sm text-muted-foreground">
            Register your restaurant and start building your digital menu.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card">
          <ChefHat className="h-10 w-10 text-primary" />
          <h3 className="font-semibold text-lg">Manage Your Menu</h3>
          <p className="text-sm text-muted-foreground">
            Add dishes, set prices, and organize by categories.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 p-6 rounded-lg border bg-card">
          <ShoppingBag className="h-10 w-10 text-primary" />
          <h3 className="font-semibold text-lg">Take Orders</h3>
          <p className="text-sm text-muted-foreground">
            Customers browse and place orders. Track everything in one dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
