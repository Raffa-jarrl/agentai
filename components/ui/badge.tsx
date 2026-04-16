import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand text-white",
        secondary: "bg-muted text-foreground",
        outline: "border-border text-foreground",
        hot: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        warm: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
        cold: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
        emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
        teal: "bg-teal/15 text-teal-600",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-3 py-1 text-sm",
        lg: "px-3.5 py-1.5 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
