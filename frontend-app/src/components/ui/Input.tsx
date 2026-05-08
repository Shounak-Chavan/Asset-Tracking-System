import * as React from "react";
import { cn } from "../../lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "flex w-full px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 focus:bg-blue-50/20 placeholder:text-gray-400 hover:border-gray-300 disabled:pointer-events-none disabled:opacity-50 disabled:bg-gray-50",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500/15 bg-red-50/30",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[0.8rem] font-medium text-red-500 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <circle cx="6" cy="6" r="5.5" stroke="currentColor"/>
              <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
