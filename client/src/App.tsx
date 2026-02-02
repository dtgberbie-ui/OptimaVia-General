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
import OnboardingWorker from "@/pages/OnboardingWorker";
import JobsList from "@/pages/JobsList";
import JobDetail from "@/pages/JobDetail";
import EmployerDashboard from "@/pages/EmployerDashboard";
import CreateJob from "@/pages/CreateJob";
import JobApplicants from "@/pages/JobApplicants";
import WorkerDashboard from "@/pages/WorkerDashboard";
import StaffManagement from "@/pages/StaffManagement";
import TaskScheduling from "@/pages/TaskScheduling";
import FinancialTracking from "@/pages/FinancialTracking";
import JobBoardPosting from "@/pages/JobBoardPosting";

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType, allowedRoles?: string[] }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/jobs" component={JobsList} />
        <Route path="/jobs/:id" component={JobDetail} />
        
        {/* Onboarding */}
        <Route path="/onboarding/employer">
          <ProtectedRoute component={OnboardingEmployer} allowedRoles={['employer']} />
        </Route>
        <Route path="/onboarding/worker">
          <ProtectedRoute component={OnboardingWorker} allowedRoles={['worker']} />
        </Route>

        {/* Employer Routes */}
        <Route path="/employer/dashboard">
          <ProtectedRoute component={EmployerDashboard} allowedRoles={['employer']} />
        </Route>
        <Route path="/employer/jobs/new">
          <ProtectedRoute component={CreateJob} allowedRoles={['employer']} />
        </Route>
        <Route path="/employer/jobs/:id/applicants">
          <ProtectedRoute component={JobApplicants} allowedRoles={['employer']} />
        </Route>
        <Route path="/employer/jobs/:id/posting">
          <ProtectedRoute component={JobBoardPosting} allowedRoles={['employer']} />
        </Route>
        <Route path="/employer/staff">
          <ProtectedRoute component={StaffManagement} allowedRoles={['employer']} />
        </Route>
        <Route path="/employer/tasks">
          <ProtectedRoute component={TaskScheduling} allowedRoles={['employer']} />
        </Route>
        <Route path="/employer/finances">
          <ProtectedRoute component={FinancialTracking} allowedRoles={['employer']} />
        </Route>

        {/* Worker Routes */}
        <Route path="/worker/dashboard">
          <ProtectedRoute component={WorkerDashboard} allowedRoles={['worker']} />
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
