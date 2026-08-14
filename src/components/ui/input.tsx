import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  rightElement,
  containerClassName = "",
  className = "",
  id,
  ...props
}) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "_");

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <label
        htmlFor={inputId}
        className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider"
      >
        {label}
        {props.required && <span className="text-rose-400 ml-1">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            block w-full rounded-xl border bg-[#0B1220] text-slate-100 text-sm font-medium
            placeholder:text-slate-500 placeholder:font-normal
            focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
            transition-colors duration-150 min-h-[44px]
            ${icon ? "pl-10" : "pl-3.5"}
            ${rightElement ? "pr-10" : "pr-3.5"}
            ${error
              ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500 bg-rose-950/20"
              : "border-slate-700 hover:border-slate-600"
            }
            ${className}
          `}
          {...props}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-400 font-medium flex items-center gap-1 font-mono">
          <span>⚠</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-400 font-medium">{helperText}</p>
      )}
    </div>
  );
};

interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

export const SelectInput: React.FC<SelectInputProps> = ({
  label,
  error,
  helperText,
  containerClassName = "",
  className = "",
  id,
  children,
  ...props
}) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "_");

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <label htmlFor={inputId} className="block text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
        {label}
        {props.required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <select
        id={inputId}
        className={`
          block w-full rounded-xl border bg-[#0B1220] text-slate-100 text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500
          transition-colors duration-150 min-h-[44px] pl-3.5 pr-8 cursor-pointer
          ${error
            ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
            : "border-slate-700 hover:border-slate-600"
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-400 font-medium font-mono">⚠ {error}</p>}
      {helperText && !error && <p className="text-xs text-slate-400 font-medium">{helperText}</p>}
    </div>
  );
};
