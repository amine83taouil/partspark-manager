import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger" | "success";
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  className,
}: StatsCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-200 hover:shadow-md border-0 bg-gradient-card",
      variant === "danger" && "border-l-4 border-l-destructive",
      variant === "success" && "border-l-4 border-l-success",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <p className={cn(
              "text-2xl font-bold tracking-tight",
              variant === "danger" && "text-destructive",
              variant === "success" && "text-success"
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full",
              "bg-primary/10 text-primary",
              variant === "danger" && "bg-destructive/10 text-destructive",
              variant === "success" && "bg-success/10 text-success"
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}