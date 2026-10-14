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
        className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider skeuo-engraved-text"
      >
        {label}
        {props.required && <span className="text-rose-500 ml-1 font-black">*</span>}
      </label>

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            skeuo-input block w-full text-slate-900 text-sm font-semibold
            placeholder:text-slate-400 placeholder:font-normal
            min-h-[44px]
            ${icon ? "pl-10" : "pl-3.5"}
            ${rightElement ? "pr-10" : "pr-3.5"}
            ${error
              ? "border-rose-400 bg-rose-50 text-rose-950 focus:border-rose-500 focus:ring-rose-400"
              : ""
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
        <p className="text-xs text-rose-600 font-bold flex items-center gap-1 font-mono">
          <span>⚠</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500 font-medium">{helperText}</p>
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
      <label htmlFor={inputId} className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider skeuo-engraved-text">
        {label}
        {props.required && <span className="text-rose-500 ml-1 font-black">*</span>}
      </label>
      <select
        id={inputId}
        className={`
          skeuo-input block w-full text-slate-900 text-sm font-semibold
          min-h-[44px] pl-3.5 pr-8 cursor-pointer
          ${error
            ? "border-rose-400 bg-rose-50 text-rose-950 focus:border-rose-500"
            : ""
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-rose-600 font-bold font-mono">⚠ {error}</p>}
      {helperText && !error && <p className="text-xs text-slate-500 font-medium">{helperText}</p>}
    </div>
  );
};

