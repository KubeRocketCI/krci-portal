import { DialogContent } from "@/core/components/ui/dialog";
import { useFormGuide } from "@/core/providers/FormGuide/hooks";
import { cn } from "@/core/utils/classname";

interface FormGuideDialogContentProps extends React.ComponentProps<typeof DialogContent> {
  baseMaxWidth?: string;
  expandedMaxWidth?: string;
}

/** `aria-describedby` defaults to undefined. Pass the prop to override. */
export function FormGuideDialogContent({
  children,
  className,
  baseMaxWidth = "max-w-4xl",
  expandedMaxWidth = "max-w-6xl",
  ...props
}: FormGuideDialogContentProps) {
  const { isOpen } = useFormGuide();

  return (
    <DialogContent
      aria-describedby={undefined}
      className={cn("w-full transition-[max-width]", isOpen ? expandedMaxWidth : baseMaxWidth, className)}
      {...props}
    >
      {children}
    </DialogContent>
  );
}
