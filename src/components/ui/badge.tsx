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
  const baseStyles =
    "inline-flex items-center px-3 py-1 text-xs font-mono font-bold rounded-lg border tracking-wider uppercase transition-all duration-150 shadow-[2px_2px_5px_#cad4e2,-2px_-2px_5px_#ffffff,inset_0_1px_1px_rgba(255,255,255,0.9)]";

  const variants = {
    primary: "bg-sky-50 text-sky-800 border-sky-300/80 shadow-[0_0_8px_rgba(14,165,233,0.25)]",
    secondary: "bg-teal-50 text-teal-800 border-teal-300/80 shadow-[0_0_8px_rgba(20,184,166,0.25)]",
    neutral: "bg-slate-100 text-slate-700 border-slate-300/90",
    p1: "bg-rose-50 text-rose-700 border-rose-300 font-black shadow-[0_0_10px_rgba(244,63,94,0.3)]",
    p2: "bg-amber-50 text-amber-800 border-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]",
    p3: "bg-yellow-50 text-yellow-800 border-yellow-300 font-semibold",
    p4: "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold",
    success: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold",
    info: "bg-sky-50 text-sky-800 border-sky-300 font-bold",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

