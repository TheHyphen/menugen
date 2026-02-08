import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, LogOut, User, Store, ShoppingBag } from "lucide-react";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            MenuGen
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/restaurants">
                    <Store className="mr-2 h-4 w-4" />
                    Browse
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/my/restaurants">
                    <User className="mr-2 h-4 w-4" />
                    My Restaurants
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/my/orders">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    My Orders
                  </Link>
                </Button>
                <span className="text-sm text-muted-foreground ml-2">{user.name}</span>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/restaurants">Browse</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
