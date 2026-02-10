import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { LS_KEY_PORTAL_TOURS } from "@/core/services/local-storage/keys";
import type { ToursStorageData, TourCompletionRecord, TourTriggerInfo } from "../types";

const CURRENT_SCHEMA_VERSION = 1;
const TOUR_RETENTION_DAYS = 180; // 6 months

/**
 * Get the current app version from package.json
 * In production, this should come from your build process
 */
function getAppVersion(): string {
  // TODO: Replace with actual version from build process
  return "2.1.0";
}

/**
 * Get tours data from localStorage with schema validation
 */
function getToursData(): ToursStorageData {
  const data = LOCAL_STORAGE_SERVICE.getItem(LS_KEY_PORTAL_TOURS) as ToursStorageData | null;

  if (!data || data.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return initializeToursData();
  }

  return data;
}

/**
 * Initialize or migrate tours data
 */
function initializeToursData(): ToursStorageData {
  const data: ToursStorageData = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    tours: {},
    firstVisit: new Date().toISOString(),
  };

  saveToursData(data);
  return data;
}

/**
 * Save tours data to localStorage
 */
function saveToursData(data: ToursStorageData): void {
  LOCAL_STORAGE_SERVICE.setItem(LS_KEY_PORTAL_TOURS, data);
}

/**
 * Clean up old tour completion records
 */
function cleanupOldTours(data: ToursStorageData): ToursStorageData {
  const cutoffDate = Date.now() - TOUR_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const cleanedTours: Record<string, TourCompletionRecord> = {};

  for (const [tourId, record] of Object.entries(data.tours)) {
    if (record.completedAt > cutoffDate) {
      cleanedTours[tourId] = record;
    }
  }

  return {
    ...data,
    tours: cleanedTours,
  };
}

/**
 * Check if a tour has been completed
 */
export function isTourCompleted(tourId: string): boolean {
  const data = getToursData();
  return !!data.tours[tourId];
}

/**
 * Get tour completion data for a specific tour
 */
export function getTourData(tourId: string): TourCompletionRecord | undefined {
  const data = getToursData();
  return data.tours[tourId];
}

/**
 * Mark a tour as completed
 */
export function markTourCompleted(tourId: string, completed = true, trigger?: TourTriggerInfo): void {
  let data = getToursData();

  data.tours[tourId] = {
    completedAt: Date.now(),
    version: getAppVersion(),
    completed,
    trigger,
  };

  data = cleanupOldTours(data);
  saveToursData(data);
}

/**
 * Reset a specific tour (useful for testing or user preference)
 */
export function resetTour(tourId: string): void {
  const data = getToursData();
  delete data.tours[tourId];
  saveToursData(data);
}

/**
 * Reset all tours
 */
export function resetAllTours(): void {
  const data = getToursData();
  data.tours = {};
  saveToursData(data);
}

/**
 * Get the date when the user first visited the app
 */
export function getFirstVisitDate(): string | undefined {
  const data = getToursData();
  return data.firstVisit;
}

/**
 * Get all completed tour IDs
 */
export function getCompletedTourIds(): string[] {
  const data = getToursData();
  return Object.keys(data.tours);
}
