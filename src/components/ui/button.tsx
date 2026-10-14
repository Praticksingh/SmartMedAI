import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "teal";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    "skeuo-btn inline-flex items-center justify-center font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variants = {
    primary: "skeuo-btn-primary focus:ring-sky-500",
    secondary: "skeuo-btn-secondary focus:ring-slate-400",
    outline: "skeuo-btn-secondary border-slate-300 text-slate-700 hover:text-sky-700 focus:ring-sky-500",
    danger: "skeuo-btn-danger focus:ring-rose-500",
    teal: "skeuo-btn-teal focus:ring-teal-500",
    ghost: "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 active:bg-slate-300/80 rounded-xl focus:ring-slate-400",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs min-h-[36px] rounded-lg",
    md: "px-5 py-2.5 text-sm min-h-[44px] rounded-xl",
    lg: "px-7 py-3.5 text-base min-h-[50px] rounded-xl",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

