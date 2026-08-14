import React from "react";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 0-indexed
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connector line behind steps */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-teal-500 z-0 transition-all duration-500 ease-out"
          style={{
            width: currentStep === 0
              ? "0%"
              : `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={idx} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`
                  h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold
                  border-2 transition-all duration-300
                  ${isCompleted
                    ? "bg-teal-600 border-teal-600 text-white shadow-md"
                    : isActive
                    ? "bg-white border-teal-500 text-teal-600 shadow-md ring-4 ring-teal-100"
                    : "bg-white border-slate-300 text-slate-400"
                  }
                `}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <span>{idx + 1}</span>}
              </div>

              <div className="mt-2 text-center">
                <span
                  className={`block text-xs font-semibold tracking-wide ${
                    isActive ? "text-teal-700" : isCompleted ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="block text-[10px] text-slate-400 mt-0.5 hidden sm:block">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
