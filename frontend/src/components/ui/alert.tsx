import React from "react";
import clsx from "clsx";
import type { ReactNode } from "react";

export interface AlertProps {
  variant?: "success" | "error" | "warning" | "info";
  children: ReactNode | string;
  className?: string;
  code?: number; // optional status code
}

export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  children,
  className,
  code,
}) => {
  const baseClasses = "p-4 rounded-lg border-l-4 mb-4";
  const variantClasses = clsx({
    "bg-green-900 border-green-500 text-green-200": variant === "success",
    "bg-red-900 border-red-500 text-red-200": variant === "error",
    "bg-yellow-900 border-yellow-500 text-yellow-200": variant === "warning",
    "bg-blue-900 border-blue-500 text-blue-200": variant === "info",
  });

  // Override for session timeout
  let displayMessage = children;
  if (code === 401) {
    displayMessage = "Session Timed Out. Please login again.";
  }

  return <div className={clsx(baseClasses, variantClasses, className)}>{displayMessage}</div>;
};

export interface AlertDescriptionProps {
  children: ReactNode;
  className?: string;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
  className,
}) => {
  return <div className={clsx("text-sm text-gray-300", className)}>{children}</div>;
};
