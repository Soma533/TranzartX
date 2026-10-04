import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:opacity-90",
        secondary: "bg-secondary text-foreground hover:bg-muted",
        outline: "border border-border bg-white hover:bg-secondary"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
