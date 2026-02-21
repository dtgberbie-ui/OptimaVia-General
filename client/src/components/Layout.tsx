import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Briefcase, User, LogOut, Users, Calendar, DollarSign, CalendarDays, LayoutDashboard } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  const isEmployer = user?.role === "employer";

  const employerNavItems = [
    { label: "Dashboard", href: "/employer/dashboard", icon: LayoutDashboard, match: (loc: string) => loc === "/employer/dashboard" },
    { label: "Hiring", href: "/employer/hiring", icon: Briefcase, match: (loc: string) => loc.startsWith("/employer/hiring") || loc.startsWith("/employer/jobs") },
    { label: "Workforce", href: "/employer/staff", icon: Users, match: (loc: string) => loc === "/employer/staff" },
    { label: "Operations", href: "/employer/operations", icon: CalendarDays, match: (loc: string) => loc.startsWith("/employer/operations") || loc === "/employer/tasks" || loc === "/employer/shifts" },
    { label: "Finance", href: "/employer/finances", icon: DollarSign, match: (loc: string) => loc === "/employer/finances" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
                <Briefcase className="h-6 w-6" />
                <span>OptimaVia</span>
              </Link>

              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <Link href="/jobs" className={`px-3 py-2 rounded-md hover:text-primary hover:bg-muted/50 transition-colors ${location === "/jobs" ? "text-primary font-semibold bg-muted/50" : ""}`}>
                  Find Jobs
                </Link>
                {isEmployer && employerNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md hover:text-primary hover:bg-muted/50 transition-colors flex items-center gap-1.5 ${item.match(location) ? "text-primary font-semibold bg-muted/50" : ""}`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
                {user && !isEmployer && (
                  <Link href="/worker/dashboard" className={`px-3 py-2 rounded-md hover:text-primary hover:bg-muted/50 transition-colors ${location === "/worker/dashboard" ? "text-primary font-semibold bg-muted/50" : ""}`}>
                    My Applications
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-muted">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="text-muted-foreground" disabled>
                      <User className="mr-2 h-4 w-4" />
                      {user.username}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isEmployer && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/employer/dashboard" className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth">
                    <Button variant="ghost" size="sm">Log In</Button>
                  </Link>
                  <Link href="/auth">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} OptimaVia. Making Work Seamless</p>
        </div>
      </footer>
    </div>
  );
}
