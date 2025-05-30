export const dialogName = "MANAGE_CODEBASE_DIALOG";

export const mainTabs = {
  selection: "SELECTION",
  configuration: "CONFIGURATION",
} as const;

export const selectionSteps = {
  selectComponent: "SELECT_COMPONENT",
  selectStrategy: "SELECT_STRATEGY",
} as const;

export const selectionStepper = {
  [selectionSteps.selectComponent]: {
    idx: 0,
    label: "Select component",
  },
  [selectionSteps.selectStrategy]: {
    idx: 1,
    label: "Select strategy",
  },
};

export const mainStepperSteps = Object.values(selectionStepper).map(({ label }) => label);

export const configurationSteps = {
  codebaseInfo: "CODEBASE_INFO",
  advancedSettings: "ADVANCED_SETTINGS",
} as const;

export const configurationStepper = {
  [configurationSteps.codebaseInfo]: {
    idx: 0,
    label: "Add component info",
  },
  [configurationSteps.advancedSettings]: {
    idx: 1,
    label: "Specify advanced settings",
  },
};

export const configurationStepperSteps = Object.values(configurationStepper).map(({ label }) => label);

export const configurationStepperLastIndex = Object.keys(configurationStepper).length - 1;
