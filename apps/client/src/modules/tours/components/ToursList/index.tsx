import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Play, RotateCcw, CheckCircle2, Circle, Info } from "lucide-react";
import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { TOURS_CONFIG } from "../../config";
import { useTours } from "../../providers/hooks";
import { isTourCompleted, resetTour, resetAllTours } from "../../services";

interface TourListItem {
  key: string;
  id: string;
  title: string;
  description: string;
  showOnce: boolean;
  stepsCount: number;
}

function buildToursList(): TourListItem[] {
  return Object.entries(TOURS_CONFIG).map(([key, tour]) => ({
    key,
    id: tour.id,
    title: tour.title,
    description: tour.description,
    showOnce: tour.showOnce,
    stepsCount: tour.steps.length,
  }));
}

function getCompletedTourIds(): Set<string> {
  const completed = new Set<string>();

  for (const tour of Object.values(TOURS_CONFIG)) {
    if (isTourCompleted(tour.id)) {
      completed.add(tour.id);
    }
  }

  return completed;
}

export function ToursList() {
  const { startTour, isRunning } = useTours();
  const tours = useMemo(() => buildToursList(), []);

  const [completedTours, setCompletedTours] = useState<Set<string>>(getCompletedTourIds);

  const refreshCompletedTours = useCallback(() => {
    setCompletedTours(getCompletedTourIds());
  }, []);

  const prevIsRunning = useRef(isRunning);
  useEffect(() => {
    if (prevIsRunning.current && !isRunning) {
      refreshCompletedTours();
    }
    prevIsRunning.current = isRunning;
  }, [isRunning, refreshCompletedTours]);

  const handleReplayTour = useCallback(
    (item: TourListItem) => {
      const tourConfig = TOURS_CONFIG[item.key];
      if (!tourConfig) return;

      if (completedTours.has(tourConfig.id)) {
        resetTour(tourConfig.id);
        setCompletedTours((prev) => {
          const next = new Set(prev);
          next.delete(tourConfig.id);
          return next;
        });
      }

      const allTargetsPresent = tourConfig.steps.every((step) => {
        if (typeof step.target === "string") {
          return document.querySelector(step.target) !== null;
        }
        return true;
      });

      if (allTargetsPresent) {
        const firstStepTarget = tourConfig.steps[0]?.target;
        if (typeof firstStepTarget === "string") {
          document.querySelector(firstStepTarget)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }

        setTimeout(() => {
          startTour(tourConfig.id, tourConfig, { type: "manual" });
        }, 300);
      }
    },
    [completedTours, startTour]
  );

  const handleResetTour = useCallback((item: TourListItem) => {
    resetTour(item.id);
    setCompletedTours((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
  }, []);

  const handleResetAllTours = useCallback(() => {
    resetAllTours();
    setCompletedTours(new Set());
  }, []);

  const completedCount = completedTours.size;
  const totalCount = tours.length;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="text-left">
            <h4 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-100">How Tours Work</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Click <strong>Start</strong> or <strong>Replay</strong> to launch a tour. If the tour elements are already
              visible on your current page, the tour will start immediately. Otherwise, you'll be navigated to the
              appropriate page first.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tours Overview</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Completed {completedCount} of {totalCount} available tours
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Completion Rate</div>
            </div>
            <Button variant="outline" onClick={handleResetAllTours} disabled={completedCount === 0}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset All Tours
            </Button>
          </div>
        </div>
      </Card>

      {/* Tours List */}
      <div className="space-y-4">
        {tours.map((item) => {
          const isCompleted = completedTours.has(item.id);

          return (
            <Card key={item.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start gap-4">
                  {/* Status Icon */}
                  <div className="mt-1">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  {/* Tour Info */}
                  <div className="flex-1 text-left">
                    <div className="mb-2 flex items-center gap-3">
                      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.title}</h4>
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                        >
                          Completed
                        </Badge>
                      )}
                      {item.showOnce && (
                        <Badge variant="outline" className="text-xs">
                          Show Once
                        </Badge>
                      )}
                    </div>

                    <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>

                    {/* Tour Metadata */}
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {item.stepsCount} {item.stepsCount === 1 ? "step" : "steps"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="ml-4 flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleReplayTour(item)} disabled={isRunning}>
                    <Play className="mr-2 h-4 w-4" />
                    {isCompleted ? "Replay" : "Start"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetTour(item)}
                    disabled={!isCompleted}
                    title={isCompleted ? "Reset tour progress" : "Tour not completed yet"}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {tours.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Info className="mx-auto mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">No Tours Available</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                There are no tours configured yet. Check back later for new feature tours.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
