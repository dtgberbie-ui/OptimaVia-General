import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Briefcase, User, LogOut, Menu } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();

  const isEmployer = user?.role === "employer";

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
              
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                <Link href="/jobs" className={`hover:text-primary transition-colors ${location === "/jobs" ? "text-primary font-semibold" : ""}`}>
                  Find Jobs
                </Link>
                {isEmployer && (
                  <>
                    <Link href="/employer/dashboard" className={`hover:text-primary transition-colors ${location.startsWith("/employer") ? "text-primary font-semibold" : ""}`}>
                      Dashboard
                    </Link>
                    <Link href="/employer/jobs/new" className={`hover:text-primary transition-colors ${location === "/employer/jobs/new" ? "text-primary font-semibold" : ""}`}>
                      Post a Job
                    </Link>
                  </>
                )}
                {user && !isEmployer && (
                  <Link href="/worker/dashboard" className={`hover:text-primary transition-colors ${location === "/worker/dashboard" ? "text-primary font-semibold" : ""}`}>
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
          <p>&copy; {new Date().getFullYear()} OptimaVia. Making workforce reliability standard.</p>
        </div>
      </footer>
    </div>
  );
}
