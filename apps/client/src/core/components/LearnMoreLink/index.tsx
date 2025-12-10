import { Button } from "@/core/components/ui/button";
import { BookOpen } from "lucide-react";

export const LearnMoreLink = ({ url }: { url: string }) => {
  return (
    <Button variant="ghost" asChild size="sm" className="hover:bg-primary/10 hover:text-accent-foreground text-primary">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <span className="flex items-center gap-1.5 text-sm">
          <BookOpen className="size-4" />
          Learn more.
        </span>
      </a>
    </Button>
  );
};
