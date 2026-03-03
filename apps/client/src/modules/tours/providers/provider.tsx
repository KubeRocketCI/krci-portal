import { useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from "react";
import Joyride, { type CallBackProps, ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useParams } from "@tanstack/react-router";
import { useAuth } from "@/core/auth/provider";
import { ToursContext } from "./context";
import type { TourMetadata, TourTriggerInfo } from "../types";
import type { TourEndCallback, TourStepCallback } from "./types";
import { isTourCompleted, markTourCompleted } from "../services";
import { TOURS_CONFIG } from "../config";
import { router } from "@/core/router";
import { Button } from "@/core/components/ui/button";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { waitForElement } from "../utils/waitForElement";
import { isTourEligible, buildActivationContext } from "../utils";

const AUTO_TRIGGER_DELAY_MS = 500;
const NAVIGATION_START_DELAY_MS = 100;
const ELEMENT_WAIT_TIMEOUT_MS = 5000;
const POST_NAVIGATION_GLOW_MS = 800;

interface ToursProviderProps {
  children: ReactNode;
}

export function ToursProvider({ children }: ToursProviderProps) {
  const { isAuthenticated } = useAuth();
  const currentRouteParams = useParams({ strict: false });
  const [currentTour, setCurrentTour] = useState<TourMetadata | null>(null);
  const [run, setRun] = useState(false);
  const [currentTrigger, setCurrentTrigger] = useState<TourTriggerInfo | undefined>();
  const [stepIndex, setStepIndex] = useState(0);
  const [isTourNavigating, setIsTourNavigating] = useState(false);
  const [currentTourTab, setCurrentTourTab] = useState<string | null>(null);
  const onTourEndRef = useRef<TourEndCallback | null>(null);
  const onStepCallbackRef = useRef<TourStepCallback | null>(null);
  /**
   * Reference to react-joyride's internal `store` API for programmatic step control.
   * Uses undocumented internals validated against react-joyride v2.9.x.
   * If upgrading react-joyride, verify that `store.prev()` and `store.next()` still exist.
   */
  const joyrideRef = useRef<{
    store: {
      prev: () => void;
      next: () => void;
    };
  } | null>(null);
  const navigationAbortRef = useRef<AbortController | null>(null);
  const navigationTimeoutIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const setTrackedTimeout = useCallback((fn: () => void | Promise<void>, delay: number) => {
    const id = setTimeout(() => {
      navigationTimeoutIds.current.delete(id);
      Promise.resolve(fn()).catch((err) => console.warn("Navigation timeout error:", err));
    }, delay);
    navigationTimeoutIds.current.add(id);
    return id;
  }, []);

  const cancelNavigation = useCallback(() => {
    navigationAbortRef.current?.abort();
    navigationAbortRef.current = null;
    for (const id of navigationTimeoutIds.current) {
      clearTimeout(id);
    }
    navigationTimeoutIds.current.clear();
    setIsTourNavigating(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => cancelNavigation(), [cancelNavigation]);

  // Determine if current tour is a popup (single-step informative)
  const isPopup = currentTour?.type === "popup";

  const startTour = useCallback((tourId: string, tour: TourMetadata, trigger?: TourTriggerInfo) => {
    const isCompleted = isTourCompleted(tourId);

    if (tour.showOnce && isCompleted) {
      return;
    }

    setCurrentTour(tour);
    setCurrentTrigger(trigger);
    setStepIndex(0);
    setRun(true);

    // Extract initial tab from first step's prerequisite if it exists
    const firstStep = tour.steps[0];
    if (firstStep?.prerequisite?.search) {
      const currentSearch = router.state.location.search as Record<string, unknown>;
      const finalSearch =
        typeof firstStep.prerequisite.search === "function"
          ? firstStep.prerequisite.search(currentSearch)
          : firstStep.prerequisite.search;

      const tabValue = finalSearch?.tab as string | undefined;
      if (tabValue) {
        setCurrentTourTab(tabValue);
      }
    }
  }, []);

  const endCurrentTour = useCallback(
    (completed: boolean) => {
      cancelNavigation();
      setRun(false);
      if (currentTour) {
        markTourCompleted(currentTour.id, completed, currentTrigger);
        onTourEndRef.current?.(currentTour.id, completed);
      }
      setCurrentTour(null);
      setCurrentTrigger(undefined);
      setCurrentTourTab(null);
    },
    [cancelNavigation, currentTour, currentTrigger]
  );

  const skipTour = useCallback(() => {
    endCurrentTour(false);
  }, [endCurrentTour]);

  const setOnTourEnd = useCallback((callback: TourEndCallback | null) => {
    onTourEndRef.current = callback;
  }, []);

  const setStepCallback = useCallback((callback: TourStepCallback | null) => {
    onStepCallbackRef.current = callback;
  }, []);

  // Auto-trigger onMount tours only when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const context = buildActivationContext(currentRouteParams);

    const onMountTours = Object.values(TOURS_CONFIG).filter((tour) => {
      if (tour.trigger !== "onMount") return false;
      if (tour.showOnce && isTourCompleted(tour.id)) return false;
      return isTourEligible(tour, context);
    });

    const firstTour = onMountTours[0];
    if (!firstTour) return;

    const timeoutId = setTimeout(() => {
      startTour(firstTour.id, firstTour, { type: "auto" });
    }, AUTO_TRIGGER_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, currentRouteParams, startTour]);

  // Auto-trigger route-based tours when navigating to matching routes
  useEffect(() => {
    if (!isAuthenticated) return;

    const context = buildActivationContext(currentRouteParams);

    // Find tours with route trigger that match current route
    const eligibleTours = Object.values(TOURS_CONFIG).filter((tour) => {
      if (tour.trigger !== "route") return false;
      if (tour.showOnce && isTourCompleted(tour.id)) return false;
      return isTourEligible(tour, context);
    });

    // Start first eligible tour if not already running
    if (eligibleTours.length > 0 && !run) {
      const tour = eligibleTours[0];
      const timeoutId = setTimeout(() => {
        startTour(tour.id, tour, { type: "routeChange", route: context.path });
      }, AUTO_TRIGGER_DELAY_MS);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, currentRouteParams, run, startTour]);

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, status, type } = data;

      const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

      if (finishedStatuses.includes(status as typeof STATUS.FINISHED | typeof STATUS.SKIPPED)) {
        endCurrentTour(status === STATUS.FINISHED);
        setStepIndex(0);
      } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.CLOSE) {
        endCurrentTour(false);
        setStepIndex(0);
      } else if (type === "error:target_not_found") {
        // Handle missing target (e.g., permission-gated elements like create-branch button)
        const currentStep = currentTour?.steps[stepIndex];
        console.warn(
          `⚠️ Target "${currentStep?.target}" not found for step ${stepIndex} - element may be permission-gated or hidden.`
        );

        // Note: We don't auto-skip here because the element might appear soon (from async navigation)
        // Let the navigation logic handle it
      } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
        const nextStepIndex = stepIndex + 1;
        const nextStep = currentTour?.steps[nextStepIndex];

        // Handle navigation prerequisite for the next step
        if (nextStep?.prerequisite) {
          const { to, params, search, waitFor, stabilizationDelay = 0 } = nextStep.prerequisite;

          // Pause tour but DON'T advance step yet - keep current step visible
          setRun(false);
          // Signal that navigation is happening (for visual feedback like tab highlights)
          setIsTourNavigating(true);

          // Resolve params: use provided params or fall back to current route params
          const finalParams =
            typeof params === "function"
              ? params(currentRouteParams as Record<string, string>)
              : (params ?? currentRouteParams);

          // Resolve search params and extract tab value for highlighting
          const currentSearch = router.state.location.search as Record<string, unknown>;
          const finalSearch = typeof search === "function" ? search(currentSearch) : search;

          // Extract the main tab value to track which tab the tour is focused on
          const tabValue = finalSearch?.tab as string | undefined;
          if (tabValue) {
            setCurrentTourTab(tabValue);
          }

          // Navigate to the prerequisite route
          router.navigate({
            to,
            params: finalParams,
            search: finalSearch,
          });

          // Determine which element(s) to wait for
          // Priority: waitFor > target selector
          const selectorsToWaitFor = waitFor
            ? Array.isArray(waitFor)
              ? waitFor
              : [waitFor]
            : [nextStep.target as string];

          // Cancel any previous navigation before starting a new one
          cancelNavigation();
          const abortController = new AbortController();
          navigationAbortRef.current = abortController;

          // Start checking after a small delay to allow navigation to start
          setTrackedTimeout(async () => {
            try {
              // Wait for all required elements
              for (const selector of selectorsToWaitFor) {
                await waitForElement({
                  selector,
                  timeout: ELEMENT_WAIT_TIMEOUT_MS,
                });
                if (abortController.signal.aborted) return;
              }

              // Additional stabilization delay (for animations, transitions, etc.)
              if (stabilizationDelay > 0) {
                await new Promise<void>((resolve) => {
                  setTrackedTimeout(resolve, stabilizationDelay);
                });
              }
              if (abortController.signal.aborted) return;

              // NOW advance the step index
              setStepIndex(nextStepIndex);
              // And resume the tour
              setRun(true);
              // Keep the glow visible for a moment after navigation completes
              setTrackedTimeout(() => setIsTourNavigating(false), POST_NAVIGATION_GLOW_MS);
            } catch (error) {
              if (abortController.signal.aborted) return;
              console.warn("⚠️ Element not found within timeout, advancing anyway:", error);
              setStepIndex(nextStepIndex);
              setRun(true);
              setIsTourNavigating(false);
            }
          }, NAVIGATION_START_DELAY_MS);
        } else {
          // No prerequisite, advance normally
          setStepIndex(nextStepIndex);
        }

        // Call custom callback if registered
        onStepCallbackRef.current?.(data);
      } else if (type === EVENTS.STEP_AFTER && action === ACTIONS.PREV) {
        // Handle back button
        const prevStepIndex = Math.max(0, stepIndex - 1);
        setStepIndex(prevStepIndex);
      }
    },
    [endCurrentTour, currentTour, currentRouteParams, stepIndex, cancelNavigation, setTrackedTimeout]
  );

  return (
    <ToursContext.Provider
      value={useMemo(
        () => ({
          startTour,
          skipTour,
          isTourCompleted,
          isRunning: run && !!currentTour,
          isTourNavigating,
          currentTourTab,
          setOnTourEnd,
          setStepCallback,
        }),
        [startTour, skipTour, run, currentTour, isTourNavigating, currentTourTab, setOnTourEnd, setStepCallback]
      )}
    >
      {children}
      {currentTour && (
        <>
          <Joyride
            ref={joyrideRef as React.Ref<Joyride>}
            steps={currentTour.steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress={!isPopup}
            scrollToFirstStep={false}
            scrollOffset={80}
            disableScrollParentFix
            disableScrolling
            spotlightClicks={false}
            disableOverlayClose={false}
            callback={handleJoyrideCallback}
            floaterProps={{
              disableAnimation: true,
              offset: 15,
            }}
            locale={{
              back: "Back",
              close: "Close",
              last: isPopup ? "Got it" : "Ok",
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
                textAlign: "left",
              },
              tooltipTitle: {
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--popover-foreground)",
                padding: 0,
                margin: 0,
                textAlign: "left",
              },
              tooltipContent: {
                color: "var(--muted-foreground)",
                padding: "0.5rem 0 0",
                fontSize: "0.875rem",
                lineHeight: 1.5,
                textAlign: "left",
              },
              tooltipFooter: {
                display: "none",
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
          {!isPopup && currentTour.steps.length > 1 && (
            <TourNavigation
              stepIndex={stepIndex}
              totalSteps={currentTour.steps.length}
              onBack={() => joyrideRef.current?.store.prev()}
              onNext={() => joyrideRef.current?.store.next()}
              onSkip={skipTour}
            />
          )}
        </>
      )}
    </ToursContext.Provider>
  );
}

interface TourNavigationProps {
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

function TourNavigation({ stepIndex, totalSteps, onBack, onNext, onSkip }: TourNavigationProps) {
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  return (
    <div className="bg-popover fixed top-4 left-1/2 z-[10001] flex -translate-x-1/2 items-center gap-4 rounded-lg px-10 py-4 shadow-lg">
      <div className="text-muted-foreground text-[0.8125rem] font-medium">
        {stepIndex + 1} / {totalSteps}
      </div>
      <div className="flex items-center gap-6">
        <Button onClick={onSkip} variant="ghost" size="sm">
          <X />
          Skip Tour
        </Button>
        <Button onClick={onBack} variant="ghost" size="sm" disabled={isFirstStep}>
          <ChevronLeft />
          Back
        </Button>
        <Button onClick={onNext} variant="default" size="sm">
          {isLastStep ? "Finish" : "Next"}
          {isLastStep ? <Check /> : <ChevronRight />}
        </Button>
      </div>
    </div>
  );
}
