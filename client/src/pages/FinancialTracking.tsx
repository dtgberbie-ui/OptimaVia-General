import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Plus, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function FinancialTracking() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ 
    type: "expense", 
    category: "", 
    amount: 0, 
    description: "" 
  });

  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ["/api/employer/transactions"],
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["/api/employer/financial-summary"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/employer/transactions", { 
        ...data, 
        amount: Math.round(data.amount * 100) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/financial-summary"] });
      setShowAddDialog(false);
      setNewTransaction({ type: "expense", category: "", amount: 0, description: "" });
      toast({ title: "Transaction added" });
    },
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(cents / 100);
  };

  const expenseCategories = ["Payroll", "Supplies", "Equipment", "Rent", "Utilities", "Marketing", "Other"];
  const revenueCategories = ["Services", "Contracts", "Consulting", "Other"];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary" />
            Financial Tracking
          </h1>
          <p className="text-muted-foreground">Track your revenue and expenses.</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-transaction">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Type</Label>
                <Select 
                  value={newTransaction.type} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value, category: "" })}
                >
                  <SelectTrigger data-testid="select-tx-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select 
                  value={newTransaction.category} 
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                >
                  <SelectTrigger data-testid="select-tx-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(newTransaction.type === "revenue" ? revenueCategories : expenseCategories).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount ($)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={newTransaction.amount} 
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                  data-testid="input-tx-amount"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input 
                  value={newTransaction.description} 
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Optional description"
                  data-testid="input-tx-description"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => createTransactionMutation.mutate(newTransaction)}
                disabled={createTransactionMutation.isPending || !newTransaction.category || newTransaction.amount <= 0}
                data-testid="button-submit-transaction"
              >
                {createTransactionMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                Add Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loadingSummary ? <Loader2 className="animate-spin" /> : formatCurrency(summary?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {loadingSummary ? <Loader2 className="animate-spin" /> : formatCurrency(summary?.totalExpenses || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {loadingSummary ? <Loader2 className="animate-spin" /> : formatCurrency(summary?.netIncome || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTx ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : !transactions?.length ? (
            <div className="text-center py-10 text-muted-foreground">
              No transactions yet. Add your first transaction to start tracking.
            </div>
          ) : (
            <div className="space-y-4">
              {(transactions as any[]).map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`tx-row-${tx.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${tx.type?.toLowerCase() === 'revenue' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                      {tx.type?.toLowerCase() === 'revenue' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.description || "No description"} · {format(new Date(tx.date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type?.toLowerCase() === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type?.toLowerCase() === 'revenue' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
