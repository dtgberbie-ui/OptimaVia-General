import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  TrendingUp, TrendingDown, DollarSign, ClipboardList, AlertCircle,
  ChevronRight, Plus, Users, ShoppingBag, Percent
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = { companyName: string; businessType: string | null; enabledModules: string[] | null };
type FinancialSummary = { totalRevenue: number; totalExpenses: number; netIncome: number };
type ServiceJob = {
  id: number; clientName: string; serviceAddress: string; scheduledDate: string;
  scheduledTime: string | null; status: string; priority: string;
  assignedEmployee: { name: string | null; username: string } | null;
};
type ProductWithIngredients = {
  id: number; name: string; sellingPrice: number | null; costPerUnit: number;
  category: string | null;
};
type Transaction = {
  id: number; type: string; amount: number; category: string; description: string | null; date: string;
};

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function statusBadge(s: string) {
  if (s === "in_progress") return "bg-emerald-100 text-emerald-800";
  if (s === "assigned") return "bg-blue-100 text-blue-800";
  if (s === "completed") return "bg-slate-100 text-slate-600";
  return "bg-amber-100 text-amber-800";
}
function statusLabel(s: string) {
  if (s === "in_progress") return "In Progress";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function initials(name: string | null, username: string) {
  if (name) return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return username.slice(0, 2).toUpperCase();
}

function pct(cost: number, price: number | null) {
  if (!price || price <= 0) return null;
  return ((price - cost) / price * 100);
}

function marginColor(m: number) {
  if (m >= 55) return "text-emerald-600";
  if (m >= 40) return "text-yellow-600";
  return "text-red-600";
}

export default function EmployerDashboard() {
  const { data: user } = useUser();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/employer/profile", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/employer/profile/${user?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<FinancialSummary>({
    queryKey: ["/api/employer/financial-summary"],
  });

  const modules: string[] = profile?.enabledModules ?? [];
  const hasModule = (m: string) => modules.includes(m);
  const hasFieldService = hasModule("field_service");
  const hasProductCosting = hasModule("product_costing");
  const hasFinances = hasModule("finances");

  const { data: jobs, isLoading: jobsLoading } = useQuery<ServiceJob[]>({
    queryKey: ["/api/service-jobs"],
    enabled: hasFieldService,
  });

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithIngredients[]>({
    queryKey: ["/api/products"],
    enabled: hasProductCosting,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/employer/transactions"],
    enabled: hasProductCosting,
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayJobs = jobs?.filter(j => j.scheduledDate === todayStr) ?? [];
  const activeJobs = jobs?.filter(j => j.status !== "completed") ?? [];
  const unassigned = jobs?.filter(j => j.status === "unassigned") ?? [];

  const monthLabel = new Date().toLocaleDateString("en-US", { month: "short" });

  const avgMargin = (() => {
    if (!products?.length) return null;
    const margins = products
      .map(p => pct(p.costPerUnit, p.sellingPrice))
      .filter((m): m is number => m !== null);
    if (!margins.length) return null;
    return margins.reduce((a, b) => a + b, 0) / margins.length;
  })();

  const recentExpenses = transactions
    ?.filter(t => t.type === "expense")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3) ?? [];

  const displayName = user?.name || user?.username || "";

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900" data-testid="heading-dashboard">
          {greeting()}{displayName ? `, ${displayName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {profileLoading
            ? <Skeleton className="h-4 w-40 inline-block" />
            : <>{profile?.companyName} — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</>
          }
        </p>
      </div>

      {/* Unassigned alert */}
      {hasFieldService && unassigned.length > 0 && (
        <Link href="/employer/service-jobs">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-amber-100 transition-colors">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800 font-medium">
              {unassigned.length} job{unassigned.length !== 1 ? "s" : ""} need{unassigned.length === 1 ? "s" : ""} assignment
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-amber-500 ml-auto" />
          </div>
        </Link>
      )}

      {/* Stat Cards — 2x2 grid */}
      {hasFinances && (
        <div className="grid grid-cols-2 gap-3">
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            <>
              <Link href="/employer/finances">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border border-slate-100 bg-[#F9FAFB]" data-testid="card-revenue">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Revenue ({monthLabel})</span>
                    </div>
                    <p className="text-xl font-semibold text-emerald-600">{fmt(summary?.totalRevenue ?? 0)}</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/employer/finances">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border border-slate-100 bg-[#F9FAFB]" data-testid="card-expenses">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingDown className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Expenses ({monthLabel})</span>
                    </div>
                    <p className="text-xl font-semibold text-slate-800">{fmt(summary?.totalExpenses ?? 0)}</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/employer/finances">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border border-slate-100 bg-[#F9FAFB]" data-testid="card-profit">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <DollarSign className={`h-3.5 w-3.5 ${(summary?.netIncome ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"}`} />
                      <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Profit ({monthLabel})</span>
                    </div>
                    <p className={`text-xl font-semibold ${(summary?.netIncome ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {fmt(summary?.netIncome ?? 0)}
                    </p>
                  </CardContent>
                </Card>
              </Link>

              {/* 4th card: contextual */}
              {hasFieldService ? (
                <Link href="/employer/service-jobs">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border border-slate-100 bg-[#F9FAFB]" data-testid="card-active-jobs">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <ClipboardList className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Active Jobs</span>
                      </div>
                      <p className="text-xl font-semibold text-slate-800">{activeJobs.length}</p>
                    </CardContent>
                  </Card>
                </Link>
              ) : hasProductCosting && avgMargin !== null ? (
                <Card className="border border-slate-100 bg-[#F9FAFB]" data-testid="card-avg-margin">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Percent className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Avg Margin</span>
                    </div>
                    <p className="text-xl font-semibold text-emerald-600">{avgMargin.toFixed(0)}%</p>
                  </CardContent>
                </Card>
              ) : (
                <Link href="/employer/team">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow border border-slate-100 bg-[#F9FAFB]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Users className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">Team</span>
                      </div>
                      <p className="text-xl font-semibold text-slate-800">—</p>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {/* Field Service: Today's Jobs */}
      {hasFieldService && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Today's Jobs</h2>
            <Link href="/employer/service-jobs" className="text-xs text-primary font-medium flex items-center gap-0.5">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {jobsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : todayJobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-slate-400 text-sm">No jobs scheduled for today</CardContent>
            </Card>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {todayJobs.slice(0, 3).map(job => (
                <Link key={job.id} href={`/employer/service-jobs/${job.id}`}>
                  <div className="bg-white px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer" data-testid={`job-card-${job.id}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="font-medium text-sm text-slate-900 truncate">{job.clientName}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-lg font-medium shrink-0 ${statusBadge(job.status)}`}>
                        {statusLabel(job.status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1.5">{job.serviceAddress}{job.scheduledTime ? ` · ${job.scheduledTime}` : ""}</p>
                    {job.assignedEmployee ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[9px] font-semibold shrink-0">
                          {initials(job.assignedEmployee.name, job.assignedEmployee.username)}
                        </div>
                        <span className="text-xs text-slate-400">{job.assignedEmployee.name || job.assignedEmployee.username}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No worker assigned</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Link href="/employer/service-jobs">
              <button className="w-full border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4 text-primary" /> New Job
              </button>
            </Link>
            <Link href="/employer/team">
              <button className="w-full border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> View Team
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Product Costing: Product Margins */}
      {hasProductCosting && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Product Margins</h2>
            <Link href="/employer/products" className="text-xs text-primary font-medium flex items-center gap-0.5">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {productsLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : !products?.length ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-slate-400 text-sm">No products yet — add your first recipe</CardContent>
            </Card>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {products.slice(0, 5).map(p => {
                const margin = pct(p.costPerUnit, p.sellingPrice);
                return (
                  <Link key={p.id} href="/employer/products">
                    <div className="bg-white px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3" data-testid={`product-margin-${p.id}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Cost ${p.costPerUnit.toFixed(2)}
                          {p.sellingPrice ? ` — Sells $${p.sellingPrice.toFixed(2)}` : ""}
                        </p>
                      </div>
                      {margin !== null ? (
                        <p className={`text-sm font-semibold shrink-0 ${marginColor(margin)}`}>{margin.toFixed(0)}%</p>
                      ) : (
                        <p className="text-sm text-slate-300 shrink-0">—</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Recent expenses for product biz */}
          {recentExpenses.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">Recent Expenses</h2>
                <Link href="/employer/finances" className="text-xs text-primary font-medium flex items-center gap-0.5">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {recentExpenses.map(t => (
                  <div key={t.id} className="bg-white px-4 py-3 flex items-center justify-between gap-3" data-testid={`expense-row-${t.id}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{t.description || t.category}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t.category} · {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-slate-800 shrink-0">{fmt(t.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Link href="/employer/finances">
              <button className="w-full border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                <Plus className="h-4 w-4 text-primary" /> Log Sale
              </button>
            </Link>
            <Link href="/employer/finances">
              <button className="w-full border border-slate-200 rounded-xl py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                <ShoppingBag className="h-4 w-4 text-primary" /> Log Expense
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Fallback if no modules */}
      {!hasFieldService && !hasProductCosting && !hasFinances && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-slate-500 text-sm">No modules enabled.</p>
            <Link href="/employer/settings" className="text-primary text-sm font-medium mt-1 inline-block">Go to Settings →</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
