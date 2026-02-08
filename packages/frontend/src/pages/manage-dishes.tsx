import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Dish, Restaurant } from "shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";

export function ManageDishesPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<(Restaurant & { dishes: Dish[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "Main" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (restaurantId) {
      api.getRestaurant(Number(restaurantId)).then(setRestaurant).finally(() => setLoading(false));
    }
  };

  useEffect(load, [restaurantId]);

  const openCreate = () => {
    setEditingDish(null);
    setForm({ name: "", description: "", price: "", category: "Main" });
    setDialogOpen(true);
  };

  const openEdit = (dish: Dish) => {
    setEditingDish(dish);
    setForm({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      category: dish.category,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setSubmitting(true);
    try {
      const body = { name: form.name, description: form.description, price: parseFloat(form.price), category: form.category };
      if (editingDish) {
        await api.updateDish(Number(restaurantId), editingDish.id, body);
      } else {
        await api.addDish(Number(restaurantId), body);
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (dish: Dish) => {
    if (!restaurantId) return;
    try {
      await api.updateDish(Number(restaurantId), dish.id, { available: !dish.available });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (dishId: number) => {
    if (!restaurantId || !confirm("Delete this dish?")) return;
    try {
      await api.deleteDish(Number(restaurantId), dishId);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (!restaurant) {
    return <div className="text-center py-12 text-muted-foreground">Restaurant not found</div>;
  }

  const categories = restaurant.dishes.reduce<Record<string, Dish[]>>((acc, dish) => {
    const cat = dish.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(dish);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/my/restaurants">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Back to Restaurants
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{restaurant.name} - Menu</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Dish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingDish ? "Edit Dish" : "New Dish"}</DialogTitle>
                  <DialogDescription>
                    {editingDish ? "Update dish details" : "Add a new dish to your menu"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="dish-name">Name</Label>
                    <Input
                      id="dish-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dish-desc">Description</Label>
                    <Textarea
                      id="dish-desc"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dish-price">Price ($)</Label>
                      <Input
                        id="dish-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dish-category">Category</Label>
                      <Input
                        id="dish-category"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editingDish ? "Update" : "Add Dish"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {restaurant.dishes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No dishes yet. Add your first dish to the menu.
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(categories).map(([category, dishes]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4">{category}</h2>
              <div className="space-y-3">
                {dishes.map((dish) => (
                  <Card key={dish.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{dish.name}</h3>
                          {!dish.available && (
                            <Badge variant="secondary">Unavailable</Badge>
                          )}
                        </div>
                        {dish.description && (
                          <p className="text-sm text-muted-foreground">{dish.description}</p>
                        )}
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatPrice(dish.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAvailability(dish)}
                        >
                          {dish.available ? "Mark Unavailable" : "Mark Available"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(dish)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(dish.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
