import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";

// Default renderers
const defaultChipRender = (label: string, key: string) => (
  <Badge variant="secondary" key={key}>
    {label}
  </Badge>
);

const defaultTooltipRender = (chipsToHide: string[]) => (
  <div className="px-3 py-1">
    <div className="flex flex-wrap gap-6 font-normal">
      {chipsToHide.map((chip) => defaultChipRender(chip, chip))}
    </div>
  </div>
);

// Constants
const STACK_GAP = 1;
const THEME_GAP_MULTIPLIER = 8;
const MARGIN = STACK_GAP * THEME_GAP_MULTIPLIER;

// Custom hook for chip measurements
const useChipMeasurements = (
  chipsData: string[],
  renderChip: (chip: string, key: string, size?: string) => React.ReactElement
) => {
  const measurementRef = React.useRef<HTMLDivElement>(null);
  const [measurements, setMeasurements] = React.useState<Map<string, number>>(new Map());

  const measureChips = React.useCallback(() => {
    if (!measurementRef.current) return;

    const newMeasurements = new Map<string, number>();
    const container = measurementRef.current;

    chipsData.forEach((chip, index) => {
      const element = container.children[index] as HTMLElement;
      if (element) {
        newMeasurements.set(chip, element.offsetWidth + MARGIN);
      }
    });

    setMeasurements(newMeasurements);
  }, [chipsData]);

  React.useLayoutEffect(() => {
    measureChips();
  }, [measureChips]);

  const MeasurementContainer = React.useMemo(
    () => (
      <div
        ref={measurementRef}
        className="absolute invisible pointer-events-none top-0 left-0 flex"
        style={{ gap: `${STACK_GAP * 8}px` }}
        aria-hidden="true"
      >
        {chipsData.map((chip, index) => (
          <div key={`${chip}-${index}`}>{renderChip(chip, chip)}</div>
        ))}
      </div>
    ),
    [chipsData, renderChip]
  );

  return { measurements, MeasurementContainer };
};

// Custom hook for responsive calculation
const useResponsiveCalculation = (
  chipsData: string[],
  measurements: Map<string, number>,
  containerWidth: number,
  showMoreButtonWidth: number
) => {
  return React.useMemo(() => {
    if (measurements.size === 0 || containerWidth === 0) {
      return { visibleChips: chipsData, hiddenChips: [] };
    }

    const availableWidth = containerWidth - showMoreButtonWidth - MARGIN;
    let usedWidth = 0;
    const visibleChips: string[] = [];
    const hiddenChips: string[] = [];

    for (const chip of chipsData) {
      const chipWidth = measurements.get(chip) || 0;

      if (usedWidth + chipWidth <= availableWidth) {
        usedWidth += chipWidth;
        visibleChips.push(chip);
      } else {
        hiddenChips.push(chip);
      }
    }

    return { visibleChips, hiddenChips };
  }, [chipsData, measurements, containerWidth, showMoreButtonWidth]);
};

// Custom hook for container width observation
const useContainerWidth = (ref: React.RefObject<HTMLElement | null>) => {
  const [width, setWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!ref.current) return;

    const updateWidth = () => {
      if (ref.current) {
        setWidth(ref.current.getBoundingClientRect().width);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return width;
};

// Main component
export const ResponsiveChips = ({
  chipsData,
  renderChip = defaultChipRender,
  renderTooltip = defaultTooltipRender,
}: {
  chipsData: string[];
  renderChip?: (chip: string, key: string, size?: string) => React.ReactElement;
  renderTooltip?: (chipsToHide: string[], chipsToShow: string[]) => React.ReactElement;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const showMoreButtonRef = React.useRef<HTMLDivElement>(null);

  // Get container width using ResizeObserver
  const containerWidth = useContainerWidth(containerRef);

  // Get chip measurements
  const { measurements, MeasurementContainer } = useChipMeasurements(chipsData, renderChip);

  // Get show more button width
  const [showMoreButtonWidth, setShowMoreButtonWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    if (showMoreButtonRef.current) {
      setShowMoreButtonWidth(showMoreButtonRef.current.getBoundingClientRect().width);
    }
  }, []);

  // Calculate which chips to show/hide
  const { visibleChips, hiddenChips } = useResponsiveCalculation(
    chipsData,
    measurements,
    containerWidth,
    showMoreButtonWidth
  );

  if (chipsData.length === 0) {
    return null;
  }

  return (
    <>
      {MeasurementContainer}
      <div ref={containerRef} className="w-full">
        <div className="flex flex-row items-center gap-2">
          {visibleChips.map((chip) => renderChip(chip, chip))}
          {hiddenChips.length > 0 && (
            <Tooltip title={renderTooltip(hiddenChips, visibleChips)}>
              <Badge ref={showMoreButtonRef} variant="secondary" className="shrink-0 bg-secondary/90">
                +{hiddenChips.length}
              </Badge>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );
};
