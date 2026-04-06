import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import { Plus, Pencil, Trash2, FlaskConical, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Ingredient = { id: number; name: string; unit: string; costPerUnit: number; supplier: string | null };
type Profile = { enabledModules: string[] | null };

const UNITS = ["oz", "lb", "gallon", "liter", "fl oz", "cup", "each", "gram", "kg", "ml"];

function empty() { return { name: "", unit: "oz", costPerUnit: "", supplier: "" }; }

export default function Ingredients() {
  const { toast } = useToast();
  const { data: user } = useUser();

  const { data: profile } = useQuery<Profile>({
    queryKey: ["/api/employer/profile", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/employer/profile/${user?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const modules: string[] = profile?.enabledModules ?? [];
  const isInventoryMode = modules.includes("field_service") && !modules.includes("product_costing");
  const noun = isInventoryMode ? "Item" : "Ingredient";
  const pageTitle = isInventoryMode ? "Inventory" : "Ingredients";
  const PageIcon = isInventoryMode ? Package : FlaskConical;
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState(empty());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: ingredients, isLoading } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => editing
      ? apiRequest("PATCH", `/api/ingredients/${editing.id}`, data)
      : apiRequest("POST", "/api/ingredients", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      close();
      toast({ title: editing ? `${noun} updated` : `${noun} added` });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/ingredients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDeleteId(null);
      toast({ title: `${noun} deleted` });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  function openCreate() {
    setEditing(null);
    setForm(empty());
    setShowDialog(true);
  }

  function openEdit(ing: Ingredient) {
    setEditing(ing);
    setForm({ name: ing.name, unit: ing.unit, costPerUnit: String(ing.costPerUnit), supplier: ing.supplier ?? "" });
    setShowDialog(true);
  }

  function close() { setShowDialog(false); setEditing(null); }

  function handleSave() {
    if (!form.name || !form.costPerUnit) {
      toast({ title: "Name and cost per unit are required", variant: "destructive" });
      return;
    }
    saveMutation.mutate({
      name: form.name,
      unit: form.unit,
      costPerUnit: parseFloat(form.costPerUnit),
      supplier: form.supplier || null,
    });
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900" data-testid="heading-ingredients">{pageTitle}</h1>
        <Button size="sm" onClick={openCreate} data-testid="button-add-ingredient">
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : ingredients?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <PageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No {pageTitle.toLowerCase()} yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              {isInventoryMode ? "Add items to track your inventory costs." : "Add ingredients to start building recipes."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {ingredients?.map(ing => (
            <Card key={ing.id} data-testid={`ingredient-card-${ing.id}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{ing.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">${ing.costPerUnit.toFixed(4)} / {ing.unit}</span>
                      {ing.supplier && <span>{ing.supplier}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ing)} data-testid={`button-edit-ingredient-${ing.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => setDeleteId(ing.id)} data-testid={`button-delete-ingredient-${ing.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={v => !v && close()}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${noun}` : `Add ${noun}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{noun} Name *</Label>
              <Input placeholder={isInventoryMode ? "e.g. Filter Oil, Gloves" : "e.g. Heavy Cream"} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-ingredient-name" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Unit of Measure *</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger data-testid="select-unit"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cost per {form.unit || "unit"} ($) *</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))} data-testid="input-cost-per-unit" />
              </div>
            </div>
            <div>
              <Label>Supplier (optional)</Label>
              <Input placeholder="e.g. US Foods" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} data-testid="input-supplier" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-ingredient">
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editing ? "Update" : "Add"} {noun}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Delete {noun}?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">
            {isInventoryMode ? "This will remove the item from your inventory." : "This will also remove it from any recipes."}
          </p>
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
