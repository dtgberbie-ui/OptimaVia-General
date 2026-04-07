import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Package, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Ingredient = { id: number; name: string; unit: string; costPerUnit: number };
type ProductIngredient = { id: number; ingredientId: number; quantityPerUnit: number; ingredient: Ingredient };
type Product = {
  id: number; name: string; description: string | null; category: string | null;
  sellingPrice: number | null; costPerUnit: number; batchYield: number | null;
  productIngredients: ProductIngredient[];
};

function pct(cost: number, price: number) {
  if (!price || price <= 0) return 0;
  return ((price - cost) / price * 100);
}

function marginColor(m: number) {
  if (m >= 60) return "text-green-600";
  if (m >= 40) return "text-yellow-600";
  return "text-red-600";
}

export default function Products() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", sellingPrice: "", batchYield: "1" });
  const [recipeItems, setRecipeItems] = useState<{ ingredientId: number; quantity: string }[]>([]);
  const [margin, setMargin] = useState("");

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: ingredients } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing
      ? apiRequest("PATCH", `/api/products/${editing.id}`, data)
      : apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      close();
      toast({ title: editing ? "Product updated" : "Product created" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDeleteId(null);
      toast({ title: "Product deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", category: "", sellingPrice: "", batchYield: "1" });
    setRecipeItems([]);
    setMargin("");
    setShowDialog(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      category: p.category ?? "",
      sellingPrice: p.sellingPrice != null ? String(p.sellingPrice) : "",
      batchYield: p.batchYield != null ? String(p.batchYield) : "1",
    });
    setRecipeItems(p.productIngredients.map(pi => ({ ingredientId: pi.ingredientId, quantity: String(pi.quantityPerUnit) })));
    setMargin("");
    setShowDialog(true);
  }

  function close() { setShowDialog(false); setEditing(null); }

  function addRecipeItem() {
    if (ingredients && ingredients.length > 0) {
      setRecipeItems(items => [...items, { ingredientId: ingredients[0].id, quantity: "1" }]);
    }
  }

  function removeRecipeItem(i: number) {
    setRecipeItems(items => items.filter((_, idx) => idx !== i));
  }

  // Total ingredient cost for the whole batch
  const batchYieldNum = Math.max(1, parseInt(form.batchYield) || 1);
  const totalBatchCost = recipeItems.reduce((sum, item) => {
    const ing = ingredients?.find(i => i.id === item.ingredientId);
    if (!ing) return sum;
    return sum + ing.costPerUnit * (parseFloat(item.quantity) || 0);
  }, 0);
  // Cost per single unit = total batch cost / number of items produced
  const calcCost = totalBatchCost / batchYieldNum;

  const sellingPriceNum = parseFloat(form.sellingPrice) || 0;
  const marginNum = sellingPriceNum > 0 ? pct(calcCost, sellingPriceNum) : 0;

  // If margin is entered, calculate price
  function applyMargin() {
    const m = parseFloat(margin);
    if (!m || m >= 100) return;
    const price = calcCost / (1 - m / 100);
    setForm(f => ({ ...f, sellingPrice: price.toFixed(2) }));
  }

  function handleSave() {
    if (!form.name) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }
    const data = {
      name: form.name,
      description: form.description || null,
      category: form.category || null,
      sellingPrice: sellingPriceNum || null,
      batchYield: batchYieldNum,
      ingredients: recipeItems.filter(i => i.quantity && parseFloat(i.quantity) > 0).map(i => ({
        ingredientId: i.ingredientId,
        quantityPerUnit: parseFloat(i.quantity),
      })),
    };
    saveMutation.mutate(data);
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900" data-testid="heading-products">Products</h1>
        <Button size="sm" onClick={openCreate} data-testid="button-add-product">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {/* Summary table header */}
      {products && products.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="grid grid-cols-4 text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 py-2 border-b bg-slate-50">
            <span>Product</span>
            <span className="text-right">Cost</span>
            <span className="text-right">Price</span>
            <span className="text-right">Margin</span>
          </div>
          {productsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 m-2 rounded" />)
          ) : (
            products.map(p => {
              const m = pct(p.costPerUnit, p.sellingPrice ?? 0);
              return (
                <div key={p.id} className="grid grid-cols-4 text-sm px-3 py-2.5 border-b last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(expanded === p.id ? null : p.id)} data-testid={`product-row-${p.id}`}>
                  <span className="font-medium text-slate-900 truncate pr-2">{p.name}</span>
                  <span className="text-right text-slate-600">${p.costPerUnit.toFixed(2)}</span>
                  <span className="text-right text-slate-600">{p.sellingPrice != null ? `$${p.sellingPrice.toFixed(2)}` : "—"}</span>
                  <span className={`text-right font-semibold ${p.sellingPrice ? marginColor(m) : "text-slate-400"}`}>
                    {p.sellingPrice ? `${m.toFixed(0)}%` : "—"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {!productsLoading && products?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No products yet.</p>
            <p className="text-slate-400 text-xs mt-1">Create a product and build its recipe.</p>
          </CardContent>
        </Card>
      )}

      {/* Product detail cards */}
      {products?.map(p => expanded === p.id && (
        <Card key={`detail-${p.id}`} className="border-2 border-primary/20">
          <CardHeader className="py-3 px-4 pb-0 flex flex-row items-start justify-between gap-2">
            <CardTitle className="text-base">{p.name}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(p.id)} data-testid={`button-delete-product-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-sm">
            {p.description && <p className="text-slate-500 mb-3">{p.description}</p>}
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Recipe</h3>
            {(p.batchYield ?? 1) > 1 && (
              <p className="text-xs text-slate-500 mb-2">Recipe makes <strong>{p.batchYield} units</strong></p>
            )}
            {p.productIngredients.length === 0 ? (
              <p className="text-slate-400 text-xs">No ingredients added</p>
            ) : (
              <div className="space-y-1">
                {p.productIngredients.map(pi => (
                  <div key={pi.id} className="flex justify-between text-xs">
                    <span className="text-slate-700">{pi.ingredient.name} × {pi.quantityPerUnit} {pi.ingredient.unit}</span>
                    <span className="text-slate-500">${(pi.ingredient.costPerUnit * pi.quantityPerUnit).toFixed(4)}</span>
                  </div>
                ))}
                {(p.batchYield ?? 1) > 1 && (
                  <div className="flex justify-between text-xs text-slate-500 border-t pt-1 mt-1">
                    <span>Total batch cost ({p.batchYield} units)</span>
                    <span>${(p.costPerUnit * (p.batchYield ?? 1)).toFixed(4)}</span>
                  </div>
                )}
                <div className="border-t pt-1 mt-1 flex justify-between text-sm font-semibold">
                  <span>Cost per unit</span>
                  <span>${p.costPerUnit.toFixed(4)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={v => !v && close()}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "New Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Product Name *</Label>
              <Input placeholder="e.g. Vanilla Waffle Cone" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-product-name" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Category</Label>
                <Input placeholder="e.g. Cones" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <Label>Units per Batch</Label>
                <Input type="number" step="1" min="1" placeholder="1" value={form.batchYield} onChange={e => setForm(f => ({ ...f, batchYield: e.target.value }))} data-testid="input-batch-yield" />
              </div>
            </div>
            <div>
              <Label>Selling Price per Unit ($)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))} data-testid="input-selling-price" />
            </div>
            <div>
              <Label>Description</Label>
              <Input placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Recipe Ingredients</Label>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addRecipeItem} data-testid="button-add-recipe-item">+ Add</Button>
              </div>
              <div className="space-y-2">
                {recipeItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={String(item.ingredientId)} onValueChange={v => setRecipeItems(items => items.map((x, idx) => idx === i ? { ...x, ingredientId: parseInt(v) } : x))}>
                      <SelectTrigger className="flex-1 text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ingredients?.map(ing => <SelectItem key={ing.id} value={String(ing.id)}>{ing.name} ({ing.unit})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="number" step="0.001" min="0" placeholder="Qty" className="w-20 h-8 text-xs" value={item.quantity} onChange={e => setRecipeItems(items => items.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x))} data-testid={`input-recipe-qty-${i}`} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-red-500" onClick={() => removeRecipeItem(i)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
              </div>
              {recipeItems.length > 0 && (
                <div className="mt-2 bg-slate-50 rounded-lg p-2 text-xs space-y-1">
                  {batchYieldNum > 1 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Total batch cost ({batchYieldNum} units):</span>
                      <span>${totalBatchCost.toFixed(4)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Cost per unit:</span>
                    <span>${calcCost.toFixed(4)}</span>
                  </div>
                  {sellingPriceNum > 0 && (
                    <div className={`flex justify-between font-semibold ${marginColor(marginNum)}`}>
                      <span>Margin:</span>
                      <span>{marginNum.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Margin calculator */}
            {calcCost > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-blue-700 mb-2">Target Margin Calculator</p>
                <div className="flex gap-2">
                  <Input type="number" step="1" min="0" max="99" placeholder="e.g. 65" value={margin} onChange={e => setMargin(e.target.value)} className="h-8 text-sm" data-testid="input-margin" />
                  <span className="text-sm self-center text-slate-500">%</span>
                  <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={applyMargin} data-testid="button-apply-margin">Apply</Button>
                </div>
                {margin && parseFloat(margin) < 100 && (
                  <p className="text-xs text-blue-600 mt-1.5">
                    Recommended price: <strong>${(calcCost / (1 - parseFloat(margin) / 100)).toFixed(2)}</strong>
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-product">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing ? "Update" : "Create"} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Delete Product?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">This will permanently delete this product and its recipe.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
