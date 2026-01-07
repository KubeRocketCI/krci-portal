import { ReactNode } from "react";

export interface SecurityMetricCardProps {
  /**
   * Card title (e.g., "Code Quality (SonarQube)")
   */
  title: string;

  /**
   * Optional quality gate or status badge
   */
  badge?: ReactNode;

  /**
   * Metrics badges to display on the right side
   */
  children: ReactNode;

  /**
   * Whether data is loading
   */
  isLoading?: boolean;

  /**
   * Error state
   */
  error?: Error | null;

  /**
   * Whether data is available
   * When false, shows empty state message instead of metrics
   */
  hasData?: boolean;

  /**
   * Custom empty state message to display when hasData is false
   * Can be a string or React element with links
   */
  emptyStateMessage?: ReactNode;
}
