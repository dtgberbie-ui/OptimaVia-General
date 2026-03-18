import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Shield, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-32 lg:pt-32 lg:pb-48 bg-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-slate-900 tracking-tight mb-6"
          >
            Making Work <br className="hidden md:block" />
            <span className="text-primary">Seamless</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10"
          >
            OptimaVia connects labor-critical industries with qualified candidates using intelligent scoring to predict reliability and job fit.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/20">
                I'm an Employer
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2">
                I'm a Worker
              </Button>
            </Link>
          </motion.div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white opacity-70" />
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="h-8 w-8 text-secondary" />}
              title="Verified Reliability"
              description="Our proprietary Fit & Reliability Score ensures you hire candidates who show up and perform."
            />
            <FeatureCard 
              icon={<TrendingUp className="h-8 w-8 text-primary" />}
              title="Smart Matching"
              description="AI-driven algorithms match certifications, availability, and experience instantly."
            />
            <FeatureCard 
              icon={<CheckCircle className="h-8 w-8 text-blue-500" />}
              title="Instant Outreach"
              description="Automated communication tools help you secure top talent before competitors do."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="mb-4 bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-display mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
