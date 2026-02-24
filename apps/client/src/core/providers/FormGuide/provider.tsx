import React, { useState, useCallback, useMemo } from "react";
import { FormGuideContext } from "./context";
import type { FormGuideFieldDescription, FormGuideStep } from "./types";

interface FormGuideProviderProps {
  config: Record<number, FormGuideFieldDescription[]>;
  steps: FormGuideStep[];
  currentStepIdx: number;
  docUrl?: string;
  children: React.ReactNode;
}

export const FormGuideProvider: React.FC<FormGuideProviderProps> = ({
  config,
  steps,
  currentStepIdx,
  docUrl,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({
      isOpen,
      toggle,
      currentStep: steps.find((s) => s.id === currentStepIdx),
      fields: config[currentStepIdx] ?? [],
      docUrl,
    }),
    [isOpen, toggle, steps, currentStepIdx, config, docUrl]
  );

  return <FormGuideContext.Provider value={value}>{children}</FormGuideContext.Provider>;
};
