import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand text-white",
        secondary: "border-transparent bg-muted text-foreground",
        outline: "text-foreground",
        hot: "border-transparent bg-hot-bg text-hot",
        warm: "border-transparent bg-warm-bg text-warm",
        cold: "border-transparent bg-cold-bg text-cold",
        teal: "border-transparent bg-teal/15 text-teal-600",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
