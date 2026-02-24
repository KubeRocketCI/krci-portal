import React from "react";
import { Eye } from "lucide-react";
import { Separator } from "@/core/components/ui/separator";
import { useFormGuide } from "@/core/providers/FormGuide/hooks";
import { FormGuideDocBanner } from "./FormGuideDocBanner";

export function FormGuidePanel() {
  const { isOpen, fields } = useFormGuide();

  if (!isOpen || fields.length === 0) return null;

  return (
    <div className="w-[350px] shrink-0 overflow-y-auto border-l pl-4">
      <div className="mb-3 text-sm font-medium">Form Guide</div>
      <ul className="space-y-3">
        {fields.map((field, idx) => (
          <React.Fragment key={field.fieldName}>
            <li className="text-sm">
              <div className="font-medium">{field.label}</div>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{field.description}</p>
              {field.notes && field.notes.length > 0 && (
                <ul className="text-muted-foreground mt-1.5 space-y-0.5 text-xs leading-relaxed">
                  {field.notes.map((note, noteIdx) => (
                    <li key={noteIdx} className="flex gap-1.5">
                      <span className="shrink-0">*</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              )}
              {field.visibilityHint && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-blue-600">
                  <Eye className="h-3 w-3 shrink-0" />
                  <span>{field.visibilityHint}</span>
                </div>
              )}
            </li>
            {idx < fields.length - 1 && <Separator />}
          </React.Fragment>
        ))}
      </ul>
      <FormGuideDocBanner />
    </div>
  );
}
