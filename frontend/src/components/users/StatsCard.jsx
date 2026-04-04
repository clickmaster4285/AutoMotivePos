'use client';

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentStyles = {
  primary: {
    icon: "bg-primary/10 text-primary",
    bar: "bg-primary",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500/80",
  },
  muted: {
    icon: "bg-muted text-muted-foreground",
    bar: "bg-muted-foreground/40",
  },
};

export const StatsCard = ({ label, value, Icon, accent = "primary" }) => {
  if (!Icon) {
    return null;
  }

  const a = accentStyles[accent] ?? accentStyles.primary;

  return (
    <Card className="border-border/80 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="text-2xl font-heading font-bold tracking-tight mt-1 tabular-nums">{value}</p>
          </div>
          <div className={cn("p-3 rounded-md shrink-0", a.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className={cn("mt-4 h-0.5 rounded-full w-full", a.bar, "opacity-90")} />
      </CardContent>
    </Card>
  );
};
