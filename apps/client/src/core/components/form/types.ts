// Shared types for TanStack Form components

export interface SelectOption {
  label: string | React.ReactNode;
  value: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

// Re-export React for convenience
import type React from "react";
