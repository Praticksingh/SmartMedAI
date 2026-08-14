import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "neutral" | "p1" | "p2" | "p3" | "p4" | "success" | "info";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = "",
  variant = "neutral",
  ...props
}) => {
  const baseStyles = "inline-flex items-center px-3 py-1 text-xs font-mono font-bold rounded-full border tracking-wider uppercase shadow-xs";

  const variants = {
    primary: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-glow-cyan",
    secondary: "bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-glow-teal",
    neutral: "bg-slate-800/80 text-slate-300 border-slate-700",
    p1: "bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-glow-rose font-black",
    p2: "bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-glow-amber font-bold",
    p3: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-semibold",
    p4: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold",
    success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold",
    info: "bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
