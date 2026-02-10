import { useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import Joyride, { type CallBackProps, ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useAuth } from "@/core/auth/provider";
import { ToursContext } from "./context";
import type { TourMetadata, TourTriggerInfo } from "../types";
import type { TourEndCallback } from "./types";
import { isTourCompleted, markTourCompleted } from "../services";
import { TOURS_CONFIG } from "../config";

interface ToursProviderProps {
  children: ReactNode;
}

export function ToursProvider({ children }: ToursProviderProps) {
  const { isAuthenticated } = useAuth();
  const [currentTour, setCurrentTour] = useState<TourMetadata | null>(null);
  const [run, setRun] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<TourTriggerInfo | undefined>();
  const onTourEndRef = useRef<TourEndCallback | null>(null);

  const startTour = useCallback((tourId: string, tour: TourMetadata, trigger?: TourTriggerInfo) => {
    const isCompleted = isTourCompleted(tourId);

    if (tour.showOnce && isCompleted) {
      return;
    }

    setCurrentTour(tour);
    setCurrentTrigger(trigger);
    setRun(true);
  }, []);

  const endCurrentTour = useCallback(
    (completed: boolean) => {
      setRun(false);
      if (currentTour) {
        markTourCompleted(currentTour.id, completed, currentTrigger);
        onTourEndRef.current?.(currentTour.id, completed);
      }
      setCurrentTour(null);
      setCurrentTrigger(undefined);
    },
    [currentTour, currentTrigger]
  );

  const skipTour = useCallback(() => {
    endCurrentTour(false);
  }, [endCurrentTour]);

  const setOnTourEnd = useCallback((callback: TourEndCallback | null) => {
    onTourEndRef.current = callback;
  }, []);

  // Auto-trigger onMount tours only when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const onMountTours = Object.values(TOURS_CONFIG).filter((tour) => tour.trigger === "onMount");

    for (const tour of onMountTours) {
      if (!isTourCompleted(tour.id) && tour.showOnce) {
        setTimeout(() => {
          startTour(tour.id, tour, { type: "auto" });
        }, 500);
        break; // Only trigger one tour at a time
      }
    }
  }, [isAuthenticated, startTour]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, status, type } = data;

      const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

      if (finishedStatuses.includes(status as typeof STATUS.FINISHED | typeof STATUS.SKIPPED)) {
        endCurrentTour(status === STATUS.FINISHED);
      } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.CLOSE) {
        endCurrentTour(false);
      }
    },
    [endCurrentTour]
  );

  return (
    <ToursContext.Provider
      value={{
        startTour,
        skipTour,
        isTourCompleted,
        isRunning: run && !!currentTour,
        setOnTourEnd,
      }}
    >
      {children}
      {currentTour && (
        <Joyride
          steps={currentTour.steps}
          run={run}
          continuous
          showProgress
          scrollToFirstStep={false}
          scrollOffset={0}
          disableScrollParentFix
          disableScrolling
          spotlightClicks={false}
          disableOverlayClose={false}
          callback={handleJoyrideCallback}
          locale={{
            back: "Back",
            close: "Close",
            last: "Ok",
            next: "Next",
            open: "Open",
            skip: "Skip Tour",
          }}
          styles={{
            options: {
              zIndex: 10000,
              arrowColor: "var(--popover)",
              backgroundColor: "var(--popover)",
              textColor: "var(--popover-foreground)",
              primaryColor: "var(--primary)",
              overlayColor: "rgba(0, 0, 0, 0.5)",
            },
            tooltip: {
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
              fontSize: "0.875rem",
            },
            tooltipTitle: {
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--popover-foreground)",
              padding: 0,
              margin: 0,
            },
            tooltipContent: {
              color: "var(--muted-foreground)",
              padding: "0.5rem 0 0",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            },
            tooltipFooter: {
              marginTop: "0.75rem",
            },
            buttonNext: {
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              padding: "0.375rem 0.75rem",
              outline: "none",
            },
            buttonBack: {
              color: "var(--muted-foreground)",
              fontSize: "0.8125rem",
              fontWeight: 500,
              marginRight: "0.5rem",
            },
            buttonSkip: {
              color: "var(--muted-foreground)",
              fontSize: "0.8125rem",
              fontWeight: 500,
            },
            buttonClose: {
              display: "none",
            },
            spotlight: {
              borderRadius: "var(--radius-md)",
            },
            overlay: {
              overflow: "auto",
            },
          }}
        />
      )}
    </ToursContext.Provider>
  );
}
