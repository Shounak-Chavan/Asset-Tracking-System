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
            "flex w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 disabled:pointer-events-none disabled:opacity-50 disabled:bg-gray-50",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-[0.8rem] font-medium text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
