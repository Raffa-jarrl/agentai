import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  trend?: string;
  trendColor?: "emerald" | "red" | "amber" | "neutral";
  description?: string;
}

const trendColorMap = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  red: "text-red-600 dark:text-red-400",
  amber: "text-amber-600 dark:text-amber-400",
  neutral: "text-muted-foreground",
};

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ icon, label, value, trend, trendColor = "neutral", description, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow duration-200 hover:shadow-md-hover",
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {icon && <div className="h-5 w-5 text-brand">{icon}</div>}
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          </div>
          <div className="mt-2">
            <p className="text-h3 font-bold text-brand">{value}</p>
            {trend && (
              <p className={cn("text-sm font-medium mt-1", trendColorMap[trendColor])}>{trend}</p>
            )}
          </div>
        </div>
      </div>
      {description && <p className="text-xs text-muted-foreground mt-3">{description}</p>}
    </div>
  ),
);
StatCard.displayName = "StatCard";
