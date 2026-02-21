import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Calendar, CalendarDays, ClipboardList } from "lucide-react";

export default function OperationsHub() {
  const operationsModules = [
    {
      title: "Task Management",
      description: "Create, assign, and track tasks for your team",
      icon: ClipboardList,
      href: "/employer/tasks",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Shift Scheduling",
      description: "Schedule and manage staff shifts and rotations",
      icon: CalendarDays,
      href: "/employer/shifts",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-operations-title">
          <Calendar className="h-8 w-8 text-primary" />
          Operations Management
        </h1>
        <p className="text-muted-foreground">Manage tasks, schedules, and day-to-day operations.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {operationsModules.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <Card className="hover-elevate cursor-pointer h-full transition-all" data-testid={`link-ops-${mod.title.toLowerCase().replace(/\s/g, '-')}`}>
              <CardHeader>
                <div className={`w-14 h-14 rounded-lg ${mod.bgColor} flex items-center justify-center mb-3`}>
                  <mod.icon className={`h-7 w-7 ${mod.color}`} />
                </div>
                <CardTitle className="text-xl">{mod.title}</CardTitle>
                <CardDescription className="text-base">{mod.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
