import React from "react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setActiveStep = ((_step: number) => {
  // Do nothing
}) as React.Dispatch<React.SetStateAction<number>>;

export const StepperContext = React.createContext({
  activeStep: 0,
  setActiveStep: setActiveStep,
  nextStep: () => {},
  prevStep: () => {},
  reset: () => {},
});
