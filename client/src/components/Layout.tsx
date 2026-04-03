import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Briefcase, Users, DollarSign, ClipboardList, Package, FlaskConical, Settings, LogOut, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type EmployerProfile = {
  enabledModules: string[] | null;
  companyName: string;
  businessType: string | null;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  const isBusinessOwner = user?.role === "employer";
  const isEmployee = user?.role === "employee";
  const isLoggedIn = !!user;
  const isAppUser = isBusinessOwner || isEmployee;

  const { data: profile } = useQuery<EmployerProfile>({
    queryKey: ["/api/employer/profile", user?.id],
    queryFn: async () => {
      const ownerId = isEmployee ? user?.businessId : user?.id;
      if (!ownerId) return null;
      const res = await fetch(`/api/employer/profile/${ownerId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAppUser && !!user,
  });

  const modules: string[] = profile?.enabledModules ?? [];
  const hasModule = (m: string) => modules.includes(m) || modules.length === 0;

  // Build nav items based on enabled modules
  const navItems = [
    { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard, show: true, match: (l: string) => l === "/employer/dashboard" },
    { label: "Jobs", href: "/employer/service-jobs", icon: ClipboardList, show: hasModule("field_service"), match: (l: string) => l.startsWith("/employer/service-jobs") },
    { label: "Ingredients", href: "/employer/ingredients", icon: FlaskConical, show: hasModule("product_costing"), match: (l: string) => l === "/employer/ingredients" },
    { label: "Products", href: "/employer/products", icon: Package, show: hasModule("product_costing"), match: (l: string) => l === "/employer/products" },
    { label: "Finances", href: "/employer/finances", icon: DollarSign, show: hasModule("finances"), match: (l: string) => l === "/employer/finances" },
    { label: "Team", href: "/employer/team", icon: Users, show: hasModule("team"), match: (l: string) => l === "/employer/team" },
    { label: "Settings", href: "/employer/settings", icon: Settings, show: isBusinessOwner, match: (l: string) => l === "/employer/settings" },
  ].filter(i => i.show);

  // Employee nav: only jobs they're assigned to
  const employeeNavItems = [
    { label: "My Jobs", href: "/employee/jobs", icon: ClipboardList, match: (l: string) => l.startsWith("/employee/jobs") },
  ];

  const activeNavItems = isEmployee ? employeeNavItems : navItems;

  const displayName = user?.name || user?.username || "";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  // For non-app pages (landing, auth, public job board)
  if (!isAppUser) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
          <div className="container mx-auto px-4">
            <div className="flex h-14 items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
                <Building2 className="h-5 w-5" />
                <span>OptimaVia<sub className="text-xs font-normal">Gen</sub></span>
              </Link>
              <div className="flex items-center gap-2">
                {isLoggedIn ? (
                  <Button variant="ghost" size="sm" onClick={() => logout()}>Log out</Button>
                ) : (
                  <Link href="/auth"><Button size="sm">Sign In</Button></Link>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // App shell: top header + main content + bottom tab bar
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <div className="font-bold text-sm text-slate-900 leading-tight">{profile?.companyName ?? "OptimaVia"}</div>
                {isEmployee && <div className="text-xs text-slate-500">Employee View</div>}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" data-testid="user-menu-trigger">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {initials || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-3 py-2">
                  <div className="font-medium text-sm">{user?.name || user?.username}</div>
                  {user?.email && <div className="text-xs text-slate-500">{user.email}</div>}
                  <div className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</div>
                </div>
                <DropdownMenuSeparator />
                {isBusinessOwner && (
                  <DropdownMenuItem asChild>
                    <Link href="/employer/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content — pad bottom for tab bar */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
        <div className="flex items-stretch">
          {activeNavItems.map((item) => {
            const isActive = item.match(location);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2.5 px-1 min-h-[56px] transition-colors
                  ${isActive ? "text-primary bg-primary/5" : "text-slate-400 hover:text-slate-600"}`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
