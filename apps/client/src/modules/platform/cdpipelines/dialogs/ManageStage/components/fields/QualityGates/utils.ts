export const createQualityGateTypeFieldName = (id: string) => `quality-gate.${id}.qualityGateType` as const;
export const createQualityGateStepNameFieldName = (id: string) => `quality-gate.${id}.stepName` as const;
export const createQualityGateAutotestFieldName = (id: string) => `quality-gate.${id}.autotestName` as const;
export const createQualityGateTypeAutotestsBranchFieldName = (id: string) => `quality-gate.${id}.branchName` as const;

export const createQualityGateFieldName = (id: string) => `quality-gate.${id}` as const;
