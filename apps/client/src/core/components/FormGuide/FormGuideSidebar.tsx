import React from "react";
import { Eye, X } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Separator } from "@/core/components/ui/separator";
import { useFormGuide } from "@/core/providers/FormGuide/hooks";
import { FormGuideDocBanner } from "./FormGuideDocBanner";

export function FormGuideSidebar() {
  const { isOpen, toggle, currentStep, fields } = useFormGuide();

  if (!isOpen) return null;

  return (
    <div className="w-[400px] shrink-0">
      <Card className="flex h-full flex-col">
        <CardHeader className="flex-row items-start justify-between space-y-0 p-4">
          {currentStep && (
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm">
                Step {currentStep.id}: {currentStep.label}
              </CardTitle>
              <CardDescription className="mt-1 text-xs">{currentStep.sublabel}</CardDescription>
            </div>
          )}
          <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label="Close help sidebar" className="shrink-0">
            <X size={16} />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 pt-0">
          {fields && fields.length > 0 ? (
            <ul className="space-y-3">
              {fields.map((field, idx) => (
                <React.Fragment key={field.fieldName}>
                  <li className="flex gap-3 text-sm">
                    <div className="min-w-0">
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
                    </div>
                  </li>
                  {idx < fields.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No field descriptions for this step.</p>
          )}
          <FormGuideDocBanner />
        </CardContent>
      </Card>
    </div>
  );
}
