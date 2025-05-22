
import { cn } from "@/lib/utils";
import React from "react";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4";
  children: React.ReactNode;
}

export function Heading({
  as: Component = "h1",
  children,
  className,
  ...props
}: HeadingProps) {
  const baseClasses = "font-bold text-foreground";
  
  const sizeClasses = {
    h1: "text-3xl md:text-4xl",
    h2: "text-2xl md:text-3xl",
    h3: "text-xl md:text-2xl",
    h4: "text-lg md:text-xl",
  };

  return (
    <Component
      className={cn(baseClasses, sizeClasses[Component], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
