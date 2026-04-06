import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Building2, Users, LayoutDashboard, ClipboardList, MapPin,
  DollarSign, Camera, Calculator, Tag, ArrowRight, CheckCircle2
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-5 text-center bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-2xl mx-auto">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase">
            Built for small businesses
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900 mb-5">
            Manage your team.<br />
            Track your money.<br />
            <span className="text-primary">Run your ops.</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg mx-auto">
            One app for job scheduling, financial tracking, and daily operations — built for small businesses that move fast.
          </p>
          <Link href="/auth">
            <Button size="lg" className="h-13 px-8 text-base font-semibold rounded-xl shadow-md shadow-primary/20">
              Get Started — Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/auth" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>

        {/* Subtle bg decoration */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-white to-white" />
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">One platform, built around your business</h2>
          <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">
            Up and running in minutes. No complicated setup, no IT required.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Building2,
                title: "Set up your business",
                desc: "Tell us what kind of business you run. We'll configure the right tools for you — field service, product-based, or both.",
              },
              {
                step: "02",
                icon: Users,
                title: "Add your team and start working",
                desc: "Invite your employees, create your first jobs or products, and start tracking from day one.",
              },
              {
                step: "03",
                icon: LayoutDashboard,
                title: "See everything in one place",
                desc: "Revenue, expenses, job status, team activity — your entire operation on one screen.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <span className="text-5xl font-black text-slate-100 leading-none select-none absolute top-4 right-5">{step}</span>
                <div className="bg-white w-12 h-12 rounded-xl flex items-center justify-center border border-slate-200 mb-4 shadow-sm">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Everything you need to run your operation</h2>
          <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">
            Pick the modules that fit your business. Turn off what you don't need.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="py-20 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Built for businesses like yours</h2>
          <p className="text-center text-slate-500 mb-12">Real tools for real operations — not corporate software scaled down.</p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                emoji: "🔧",
                title: "Field service companies",
                desc: "Cleaning crews, maintenance teams, mobile technicians — anyone dispatching workers to job sites.",
                tags: ["Job dispatch", "GPS navigation", "Photo proof"],
              },
              {
                emoji: "🍦",
                title: "Food & product businesses",
                desc: "Ice cream shops, bakeries, food trucks — anyone who needs to know what it costs to make what they sell.",
                tags: ["Ingredient costs", "Recipe builder", "Pricing calculator"],
              },
              {
                emoji: "📋",
                title: "Growing small businesses",
                desc: "If you're tracking jobs on paper and finances in your head, OptimaVia replaces all of it.",
                tags: ["Finances", "Team management", "Dashboard"],
              },
            ].map(({ emoji, title, desc, tags }) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-6 hover:border-primary/30 transition-colors">
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className="text-xs bg-primary/8 text-primary px-2 py-0.5 rounded-full font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="py-14 px-5 bg-slate-50 text-center">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">Trusted locally</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Trusted by small businesses in Raleigh, NC</h2>
          <p className="text-slate-500 text-sm">We're starting local and growing with our customers.</p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-5 bg-slate-900 text-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-3">Ready to run your business smarter?</h2>
          <p className="text-slate-400 mb-8">Set up takes 5 minutes. No credit card required.</p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="h-13 px-8 text-base font-semibold rounded-xl bg-white text-slate-900 hover:bg-slate-100">
              Get Started — Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 border-t border-slate-800 px-5 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Building2 className="h-4 w-4 text-primary" />
            OptimaVia <span className="text-primary font-medium ml-0.5">General</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Features</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Pricing</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
          <p>© 2026 OptimaVia. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Job scheduling",
    desc: "Create jobs, assign workers, and track progress from assigned to completed.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: MapPin,
    title: "Team dispatch",
    desc: "Workers see their assignments and tap to navigate — straight to Google Maps.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: DollarSign,
    title: "Revenue & expense tracking",
    desc: "Log every dollar in and out. See your profit in real time, not at tax season.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Camera,
    title: "Photo accountability",
    desc: "Check-in and check-out photos for every job. Proof of service, no arguments.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Calculator,
    title: "Product costing",
    desc: "Build recipes, track ingredient costs, and know exactly what it costs to make each product.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Tag,
    title: "Smart pricing",
    desc: "Set your margin, get your selling price. See which products make money and which don't.",
    color: "text-pink-600",
    bg: "bg-pink-50",
  },
];
