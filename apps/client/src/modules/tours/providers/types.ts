import type { CallBackProps } from "react-joyride";
import type { TourMetadata, TourTriggerInfo } from "../types";

export interface TourEndCallback {
  (tourId: string, completed: boolean): void;
}

export interface TourStepCallback {
  (data: CallBackProps): void;
}

export interface ToursContextValue {
  /** Start a specific tour by ID */
  startTour: (tourId: string, tour: TourMetadata, trigger?: TourTriggerInfo) => void;
  /** Skip the current tour */
  skipTour: () => void;
  /** Check if a tour has been completed */
  isTourCompleted: (tourId: string) => boolean;
  /** Whether any tour is currently running */
  isRunning: boolean;
  /** Whether the tour is currently navigating to a new step (useful for visual feedback like highlighting tabs) */
  isTourNavigating: boolean;
  /** The tab that the current tour step is focused on (e.g., "pipelines") */
  currentTourTab: string | null;
  /** Set a callback for when a tour ends */
  setOnTourEnd: (callback: TourEndCallback | null) => void;
  /** Set a callback for step transitions (for custom logic like tab switching) */
  setStepCallback: (callback: TourStepCallback | null) => void;
}
