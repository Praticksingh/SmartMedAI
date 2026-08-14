import React, { useEffect } from "react";
import { Button } from "./button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: "info" | "danger" | "success";
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  variant = "info",
}) => {
  // Prevent body scrolling when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const headerColors = {
    info: "text-slate-800",
    danger: "text-rose-700",
    success: "text-emerald-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="bg-white rounded-lg border border-slate-200/80 shadow-premium max-w-md w-full z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h3 className={`text-lg font-semibold tracking-tight ${headerColors[variant]}`}>
            {title}
          </h3>
          {description && (
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {description}
            </p>
          )}
          {children && <div className="mt-4">{children}</div>}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          {cancelText && (
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
          )}
          {onConfirm && confirmText && (
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
