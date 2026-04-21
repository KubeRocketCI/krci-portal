import { CircleHelp } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { useIsNarrow } from "@/core/hooks/use-narrow";
import { useFormGuide } from "@/core/providers/FormGuide/hooks";
import { TOURS_CONFIG, useAutoTour } from "@/modules/tours";

export function FormGuideToggleButton() {
  const isNarrow = useIsNarrow();
  const { isOpen, toggle, hasContent } = useFormGuide();

  useAutoTour(isNarrow ? null : TOURS_CONFIG.formGuide, 500);

  if (!hasContent || isNarrow) return null;

  return (
    <Button
      variant={isOpen ? "default" : "ghost"}
      size="sm"
      onClick={toggle}
      aria-label="Toggle help sidebar"
      className="relative"
      data-tour="form-guide-toggle"
    >
      <CircleHelp size={16} />
      Form Guide
      {!isOpen && <span className="bg-primary absolute -top-0 -right-0 h-2 w-2 animate-pulse rounded-full" />}
    </Button>
  );
}
