import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import AuthPage from "@/pages/AuthPage";
import OnboardingEmployer from "@/pages/OnboardingEmployer";
import EmployerDashboard from "@/pages/EmployerDashboard";
import FinancialTracking from "@/pages/FinancialTracking";
import ServiceJobs from "@/pages/ServiceJobs";
import ServiceJobDetail from "@/pages/ServiceJobDetail";
import Ingredients from "@/pages/Ingredients";
import Products from "@/pages/Products";
import TeamManagement from "@/pages/TeamManagement";
import BusinessSettings from "@/pages/BusinessSettings";
import EmployeeJobs from "@/pages/EmployeeJobs";

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Redirect to="/auth" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Redirect to="/auth" />;

  return <Component />;
}

function AppRedirect() {
  const { data: user, isLoading } = useUser();
  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Home />;
  if (user.role === "employer") return <Redirect to="/employer/dashboard" />;
  if (user.role === "employee") return <Redirect to="/employee/jobs" />;
  return <Home />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={AppRedirect} />
        <Route path="/auth" component={AuthPage} />

        {/* Onboarding */}
        <Route path="/onboarding/employer">
          <ProtectedRoute component={OnboardingEmployer} allowedRoles={["employer"]} />
        </Route>

        {/* Employer / Business Owner routes */}
        <Route path="/employer/dashboard">
          <ProtectedRoute component={EmployerDashboard} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/service-jobs/:id">
          <ProtectedRoute component={ServiceJobDetail} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/service-jobs">
          <ProtectedRoute component={ServiceJobs} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/ingredients">
          <ProtectedRoute component={Ingredients} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/products">
          <ProtectedRoute component={Products} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/finances">
          <ProtectedRoute component={FinancialTracking} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/team">
          <ProtectedRoute component={TeamManagement} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/employees/add">
          <ProtectedRoute component={TeamManagement} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/employees/:id">
          <ProtectedRoute component={TeamManagement} allowedRoles={["employer"]} />
        </Route>
        <Route path="/employer/settings">
          <ProtectedRoute component={BusinessSettings} allowedRoles={["employer"]} />
        </Route>

        {/* Employee routes */}
        <Route path="/employee/jobs/:id">
          <ProtectedRoute component={ServiceJobDetail} allowedRoles={["employee"]} />
        </Route>
        <Route path="/employee/jobs">
          <ProtectedRoute component={EmployeeJobs} allowedRoles={["employee"]} />
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
