import { HelpCircle, ExternalLink } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { useFormGuide } from "@/core/providers/FormGuide/hooks";

export function FormGuideDocBanner() {
  const { docUrl } = useFormGuide();

  if (!docUrl) return null;

  return (
    <div className="bg-muted/50 mt-4 rounded-lg border p-3">
      <div className="mb-2 flex items-center gap-2">
        <HelpCircle className="text-muted-foreground h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Need More Help?</span>
      </div>
      <p className="text-muted-foreground mb-3 text-xs">
        Check out our documentation for detailed guides and examples.
      </p>
      <Button variant="outline" size="sm" className="w-full" asChild>
        <a href={docUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-1.5 h-3 w-3" />
          View Full Documentation
        </a>
      </Button>
    </div>
  );
}
