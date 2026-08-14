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
  const baseStyles = "inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border tracking-wide";

  const variants = {
    primary: "bg-primary-50 text-primary-800 border-primary-200",
    secondary: "bg-secondary-50 text-secondary-800 border-secondary-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
    p1: "bg-triage-p1-bg text-triage-p1-text border-triage-p1-border",
    p2: "bg-triage-p2-bg text-triage-p2-text border-triage-p2-border",
    p3: "bg-triage-p3-bg text-triage-p3-text border-triage-p3-border",
    p4: "bg-triage-p4-bg text-triage-p4-text border-triage-p4-border",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    info: "bg-sky-50 text-sky-800 border-sky-200",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};
