import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Landing from "@/pages/landing";
import Registration from "@/pages/registration";
import AiTaxCalculator from "@/pages/ai-tax-calculator";
import Contact from "@/pages/contact";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminForgotPassword from "@/pages/admin-forgot-password";
import AdminResetPassword from "@/pages/admin-reset-password";
import CustomerLogin from "@/pages/customer-login";
import CustomerForgotPassword from "@/pages/customer-forgot-password";
import CustomerResetPassword from "@/pages/customer-reset-password";
import CustomerDashboard from "@/pages/customer-dashboard";
import Submissions from "@/pages/submissions";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/registration" component={Registration} />
      <Route path="/ai-calculator" component={AiTaxCalculator} />
      <Route path="/contact" component={Contact} />
      <Route path="/customer-login" component={CustomerLogin} />
      <Route path="/customer-forgot-password" component={CustomerForgotPassword} />
      <Route path="/customer/reset-password" component={CustomerResetPassword} />
      <Route path="/customer-dashboard" component={CustomerDashboard} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin-forgot-password" component={AdminForgotPassword} />
      <Route path="/admin/reset-password" component={AdminResetPassword} />
      <Route path="/admin-dashboard" component={AdminDashboard} />
      <Route path="/submissions" component={Submissions} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}