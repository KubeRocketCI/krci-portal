import type { Step } from "react-joyride";

export type TourTrigger = "route" | "manual" | "onMount" | "feature";
export type TourType = "tour" | "popup";

/**
 * Context information about the current route/page for tour activation
 */
export interface TourActivationContext {
  /** Current route path */
  path: string;
  /** Route parameters */
  params: Record<string, string>;
  /** Search parameters */
  search: Record<string, unknown>;
}

/**
 * Prerequisite conditions for a tour to be activatable
 */
export interface TourPrerequisite {
  /** Route pattern that must match (e.g., "/c/:clusterName/projects/:namespace/:name") */
  routePattern?: string;
  /** Search params that must be present */
  requiredSearch?: Record<string, unknown> | ((search: Record<string, unknown>) => boolean);
  /** Custom validator function */
  validator?: (context: TourActivationContext) => boolean;
}

/**
 * Navigation prerequisite for a tour step
 */
export interface StepPrerequisite {
  /** Route path to navigate to */
  to: string;
  /** Route params. If omitted, current route params will be preserved. */
  params?: Record<string, string> | ((current: Record<string, string>) => Record<string, string>);
  /** Search params to set */
  search?: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>);
  /** Wait for specific element(s) before considering navigation complete */
  waitFor?: string | string[];
  /** Additional delay in ms after element appears (for animations, etc) */
  stabilizationDelay?: number;
}

/**
 * Extended Step type with prerequisite navigation support
 */
export interface StepWithPrerequisite extends Step {
  /** Navigation prerequisite - will navigate before showing this step */
  prerequisite?: StepPrerequisite;
}

export interface TourMetadata {
  /** Unique identifier for the tour */
  id: string;
  /** Human-readable title */
  title: string;
  /** Description of what this tour demonstrates */
  description: string;
  /** Tour type: multi-step "tour" or single-step "popup" */
  type?: TourType;
  /** Minimum app version where this tour should be shown (semver format) */
  minVersion?: string;
  /** Maximum app version where this tour should be shown (semver format) */
  maxVersion?: string;
  /** Should this tour only show once? */
  showOnce: boolean;
  /** How should this tour be triggered? */
  trigger: TourTrigger;
  /** For route trigger: the route path pattern */
  routePattern?: string;
  /** For feature trigger: the feature identifier */
  featureId?: string;
  /** Prerequisites for this tour to be activatable */
  prerequisite?: TourPrerequisite;
  /** Steps for the tour */
  steps: StepWithPrerequisite[];
  /** Route pattern where this tour is relevant (used for navigation from tours settings page) */
  route?: string;
}

export type TourTriggerInfo = { type: "auto" } | { type: "manual" } | { type: "routeChange"; route: string };

export interface TourCompletionRecord {
  /** When the tour was completed */
  completedAt: number;
  /** App version when completed */
  version: string;
  /** Was it completed or dismissed? */
  completed: boolean;
  /** How the tour was triggered */
  trigger?: TourTriggerInfo;
}

export interface ToursStorageData {
  /** Schema version for migrations */
  schemaVersion: number;
  /** Map of tour ID to completion record */
  tours: Record<string, TourCompletionRecord>;
  /** When the user first used the app */
  firstVisit?: string;
}
