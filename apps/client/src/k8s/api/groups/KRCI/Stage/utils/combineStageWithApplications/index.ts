import { applicationLabels, Codebase, Stage, Application } from "@my-project/shared";

export interface StageWithApplication {
  stage: Stage;
  applications: {
    appCodebase: Codebase;
    argoApplication: Application;
  }[];
}

export const combineStageWithApplications = (
  applications: Application[],
  appCodebases: Codebase[],
  stages: Stage[]
): StageWithApplication[] => {
  const argoApplicationsMap = applications.reduce<Record<string, Application>>((map, argoApplication) => {
    const appName = argoApplication.metadata?.labels?.[applicationLabels.appName];
    const stageName = argoApplication.metadata?.labels?.[applicationLabels.stage];

    if (appName && stageName) {
      map[`${appName}${stageName}`] = argoApplication;
    }

    return map;
  }, {});

  return stages.map((stage) => ({
    stage,
    applications: appCodebases.map((appCodebase) => {
      const argoApplication = argoApplicationsMap[`${appCodebase?.metadata.name}${stage.spec.name}`];
      return { appCodebase, argoApplication };
    }),
  }));
};
