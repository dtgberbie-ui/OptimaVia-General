import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin, useRegister, type RegisterData } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff, Wrench, ShoppingBag, Layers } from "lucide-react";

// ── Schemas ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessType: z.enum(["field_service", "product_costing", "both"], {
    required_error: "Please select your business type",
  }),
});

// ── Business type cards ─────────────────────────────────────────────────────

const BUSINESS_TYPES = [
  {
    value: "field_service",
    icon: Wrench,
    label: "We send workers to job sites",
    desc: "Field service, cleaning, maintenance, mobile teams",
  },
  {
    value: "product_costing",
    icon: ShoppingBag,
    label: "We make and sell products",
    desc: "Food, retail, manufacturing, handmade goods",
  },
  {
    value: "both",
    icon: Layers,
    label: "Both",
    desc: "We dispatch workers AND sell products",
  },
];

// ── Main component ──────────────────────────────────────────────────────────

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: "",
      name: "",
      email: "",
      password: "",
      businessType: undefined as any,
    },
  });

  const onLogin = (data: z.infer<typeof loginSchema>) => loginMutation.mutate(data);
  const onRegister = (data: z.infer<typeof registerSchema>) =>
    registerMutation.mutate(data as RegisterData);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-display">Welcome to OptimaVia</CardTitle>
          <CardDescription>Run your operations from one place</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Create Account</TabsTrigger>
            </TabsList>

            {/* ── Login tab ── */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email or Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your@email.com or your_username"
                            autoComplete="username"
                            data-testid="input-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="••••••••"
                              autoComplete="current-password"
                              data-testid="input-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              tabIndex={-1}
                            >
                              {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-primary transition-colors"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-sign-in"
                  >
                    {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>
                  <p className="text-center text-xs text-slate-400 mt-2">
                    Employees: sign in with the username your manager gave you
                  </p>
                </form>
              </Form>
            </TabsContent>

            {/* ── Register tab ── */}
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your business name"
                            data-testid="input-business-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your full name"
                            data-testid="input-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@business.com"
                            autoComplete="email"
                            data-testid="input-register-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showRegisterPassword ? "text" : "password"}
                              placeholder="Choose a strong password"
                              autoComplete="new-password"
                              data-testid="input-register-password"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegisterPassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              tabIndex={-1}
                            >
                              {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Business type selection */}
                  <FormField
                    control={registerForm.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What does your business do?</FormLabel>
                        <div className="space-y-2 mt-1">
                          {BUSINESS_TYPES.map(({ value, icon: Icon, label, desc }) => {
                            const selected = field.value === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                data-testid={`card-business-type-${value}`}
                                onClick={() => field.onChange(value)}
                                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
                                  selected
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-200 hover:border-slate-300 bg-white"
                                }`}
                              >
                                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? "bg-primary/10" : "bg-slate-100"}`}>
                                  <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-slate-500"}`} />
                                </div>
                                <div>
                                  <p className={`text-sm font-medium leading-tight ${selected ? "text-primary" : "text-slate-800"}`}>{label}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                                </div>
                                <div className={`ml-auto mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? "border-primary" : "border-slate-300"}`}>
                                  {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-create-account"
                  >
                    {registerMutation.isPending
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
