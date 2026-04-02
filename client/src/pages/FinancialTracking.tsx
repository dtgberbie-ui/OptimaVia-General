import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Transaction = {
  id: number; type: string; category: string; amount: number;
  description: string | null; date: string; receiptPhotoUrl: string | null;
};
type Summary = { totalRevenue: number; totalExpenses: number; netIncome: number };

const EXPENSE_CATEGORIES = ["Supplies", "Labor", "Fuel", "Equipment", "Rent", "Utilities", "Food & Beverage", "Marketing", "Other"];
const REVENUE_CATEGORIES = ["Walk-in Sales", "Online Sales", "Service", "Contract", "Other"];

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
}

export default function FinancialTracking() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<"revenue" | "expense">("expense");
  const [form, setForm] = useState({ amount: "", category: "", description: "", date: new Date().toISOString().split("T")[0] });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [tab, setTab] = useState("all");

  const { data: summary, isLoading: summaryLoading } = useQuery<Summary>({
    queryKey: ["/api/employer/financial-summary"],
  });

  const { data: transactions, isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/employer/transactions"],
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/employer/transactions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/financial-summary"] });
      setShowAdd(false);
      setForm({ amount: "", category: "", description: "", date: new Date().toISOString().split("T")[0] });
      toast({ title: addType === "revenue" ? "Revenue logged" : "Expense logged" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/employer/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/financial-summary"] });
      setDeleteId(null);
      toast({ title: "Deleted" });
    },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  function openAdd(type: "revenue" | "expense") {
    setAddType(type);
    setForm({ amount: "", category: type === "revenue" ? "Walk-in Sales" : "Supplies", description: "", date: new Date().toISOString().split("T")[0] });
    setShowAdd(true);
  }

  function handleSave() {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (!form.category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    addMutation.mutate({
      type: addType,
      category: form.category,
      amount: amountCents,
      description: form.description || null,
      date: new Date(form.date),
    });
  }

  const filtered = (transactions ?? []).filter(t => {
    if (tab === "revenue") return t.type === "revenue";
    if (tab === "expense") return t.type === "expense";
    return true;
  });

  const categories = addType === "revenue" ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <h1 className="text-xl font-bold text-slate-900" data-testid="heading-finances">Finances</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {summaryLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <Card className="border-0 bg-green-50" data-testid="card-total-revenue">
              <CardContent className="p-3">
                <p className="text-[9px] text-green-600 font-medium uppercase tracking-wide mb-1">Revenue</p>
                <p className="text-base font-bold text-green-700">{fmt(summary?.totalRevenue ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-red-50" data-testid="card-total-expenses">
              <CardContent className="p-3">
                <p className="text-[9px] text-red-600 font-medium uppercase tracking-wide mb-1">Expenses</p>
                <p className="text-base font-bold text-red-700">{fmt(summary?.totalExpenses ?? 0)}</p>
              </CardContent>
            </Card>
            <Card className={`border-0 ${(summary?.netIncome ?? 0) >= 0 ? "bg-blue-50" : "bg-orange-50"}`} data-testid="card-net-income">
              <CardContent className="p-3">
                <p className={`text-[9px] font-medium uppercase tracking-wide mb-1 ${(summary?.netIncome ?? 0) >= 0 ? "text-blue-600" : "text-orange-600"}`}>Profit</p>
                <p className={`text-base font-bold ${(summary?.netIncome ?? 0) >= 0 ? "text-blue-700" : "text-orange-700"}`}>{fmt(summary?.netIncome ?? 0)}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => openAdd("revenue")} className="bg-green-600 hover:bg-green-700 h-11" data-testid="button-log-revenue">
          <TrendingUp className="h-4 w-4 mr-2" /> Log Revenue
        </Button>
        <Button onClick={() => openAdd("expense")} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 h-11" data-testid="button-log-expense">
          <TrendingDown className="h-4 w-4 mr-2" /> Log Expense
        </Button>
      </div>

      {/* Transaction list */}
      <div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="revenue" className="flex-1">Revenue</TabsTrigger>
            <TabsTrigger value="expense" className="flex-1">Expenses</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="mt-3 space-y-2">
          {txLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-slate-400 text-sm">No {tab !== "all" ? tab : ""} transactions yet</CardContent>
            </Card>
          ) : (
            filtered.map(tx => (
              <Card key={tx.id} data-testid={`transaction-${tx.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`shrink-0 rounded-lg p-1.5 ${tx.type === "revenue" ? "bg-green-100" : "bg-red-100"}`}>
                        {tx.type === "revenue" ? <TrendingUp className="h-3.5 w-3.5 text-green-600" /> : <TrendingDown className="h-3.5 w-3.5 text-red-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{tx.description || tx.category}</p>
                        <p className="text-xs text-slate-500">{tx.category} · {formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`font-semibold text-sm ${tx.type === "revenue" ? "text-green-700" : "text-red-700"}`}>
                        {tx.type === "revenue" ? "+" : "-"}{fmt(tx.amount)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => setDeleteId(tx.id)} data-testid={`button-delete-tx-${tx.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={v => !v && setShowAdd(false)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{addType === "revenue" ? "Log Revenue" : "Log Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Amount ($) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-amount" />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger data-testid="select-category"><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input placeholder="Optional note" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} data-testid="input-description" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} data-testid="input-date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={addMutation.isPending} className={addType === "revenue" ? "bg-green-600 hover:bg-green-700" : ""} data-testid="button-save-transaction">
              {addMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {addType === "revenue" ? "Log Revenue" : "Log Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={v => !v && setDeleteId(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>Delete transaction?</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">This cannot be undone.</p>
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
