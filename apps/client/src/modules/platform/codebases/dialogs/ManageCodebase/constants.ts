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

export const configurationSteps = {
  codebaseInfo: "CODEBASE_INFO",
  advancedSettings: "ADVANCED_SETTINGS",
} as const;

export const configurationStepper = {
  [configurationSteps.codebaseInfo]: {
    idx: 2,
    label: "Add component info",
  },
  [configurationSteps.advancedSettings]: {
    idx: 3,
    label: "Specify advanced settings",
  },
};

// Unified stepper steps across both tabs
export const unifiedStepperSteps = [
  selectionStepper[selectionSteps.selectComponent].label,
  selectionStepper[selectionSteps.selectStrategy].label,
  configurationStepper[configurationSteps.codebaseInfo].label,
  configurationStepper[configurationSteps.advancedSettings].label,
];

export const unifiedStepperLastIndex = unifiedStepperSteps.length - 1;
