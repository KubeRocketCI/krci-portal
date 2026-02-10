import type { Step } from "react-joyride";

export type TourTrigger = "route" | "manual" | "onMount" | "feature";

export interface TourMetadata {
  /** Unique identifier for the tour */
  id: string;
  /** Human-readable title */
  title: string;
  /** Description of what this tour demonstrates */
  description: string;
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
  /** Steps for the tour */
  steps: Step[];
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
