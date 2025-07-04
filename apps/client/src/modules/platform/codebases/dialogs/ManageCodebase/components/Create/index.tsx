import React from "react";

import { mainTabs } from "../../constants";
import { Configuration } from "./components/Inner";
import { Selection } from "./components/Selection";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { TabPanel } from "@/core/components/TabPanel";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { StepperContextProvider } from "@/core/providers/Stepper/provider";
import { ValueOf } from "@/core/types/global";

export const Create = () => {
  const baseDefaultValues = useDefaultValues();

  const [activeTab, setActiveTab] = React.useState<ValueOf<typeof mainTabs>>(mainTabs.selection);

  return (
    <FormContextProvider
      formSettings={{
        mode: "onBlur",
        defaultValues: baseDefaultValues,
      }}
    >
      <TabPanel index={mainTabs.selection} value={activeTab}>
        <StepperContextProvider>
          <Selection setActiveTab={setActiveTab} />
        </StepperContextProvider>
      </TabPanel>
      <TabPanel index={mainTabs.configuration} value={activeTab}>
        <StepperContextProvider>
          <Configuration baseDefaultValues={baseDefaultValues} setActiveTab={setActiveTab} />
        </StepperContextProvider>
      </TabPanel>
    </FormContextProvider>
  );
};
