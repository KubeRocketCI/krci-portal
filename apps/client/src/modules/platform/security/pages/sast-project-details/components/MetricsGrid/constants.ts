import { Bug, Shield, Wrench, Eye, Target, Copy, FileCode, CheckCircle } from "lucide-react";

/**
 * Metric card configuration
 */
export interface MetricCardConfig {
  id: string;
  title: string;
  icon: typeof Bug;
  metricKey: string;
  ratingKey?: string;
  trendKey?: string;
  debtKey?: string;
  type?: "number" | "percentage" | "status";
  description: string;
}

/**
 * Configuration for all 8 metric cards
 */
export const METRIC_CARDS: MetricCardConfig[] = [
  {
    id: "reliability",
    title: "Reliability",
    icon: Bug,
    metricKey: "bugs",
    ratingKey: "reliability_rating",
    trendKey: "new_bugs",
    description: "Number of bugs",
  },
  {
    id: "security",
    title: "Security",
    icon: Shield,
    metricKey: "vulnerabilities",
    ratingKey: "security_rating",
    trendKey: "new_vulnerabilities",
    description: "Number of vulnerabilities",
  },
  {
    id: "maintainability",
    title: "Maintainability",
    icon: Wrench,
    metricKey: "code_smells",
    ratingKey: "sqale_rating",
    trendKey: "new_code_smells",
    debtKey: "sqale_index",
    description: "Code smells and technical debt",
  },
  {
    id: "security-review",
    title: "Security Review",
    icon: Eye,
    metricKey: "security_hotspots",
    ratingKey: "security_review_rating",
    trendKey: "new_security_hotspots",
    description: "Security hotspots to review",
  },
  {
    id: "coverage",
    title: "Coverage",
    icon: Target,
    metricKey: "coverage",
    trendKey: "new_coverage",
    type: "percentage",
    description: "Test coverage percentage",
  },
  {
    id: "duplications",
    title: "Duplications",
    icon: Copy,
    metricKey: "duplicated_lines_density",
    trendKey: "new_duplicated_lines_density",
    type: "percentage",
    description: "Duplicated lines density",
  },
  {
    id: "size",
    title: "Size",
    icon: FileCode,
    metricKey: "ncloc",
    trendKey: "new_lines",
    description: "Lines of code",
  },
  {
    id: "quality-gate",
    title: "Quality Gate",
    icon: CheckCircle,
    metricKey: "alert_status",
    type: "status",
    description: "Quality gate status",
  },
];
