// Label set by the CronJob controller on every Job it creates, referencing the
// owning CronJob's name. Used to list the Jobs spawned by a given CronJob.
export const CRONJOB_NAME_LABEL = "cronjob.kubernetes.io/name";

// Annotation KubeRocketCI writes onto a Job template to trigger an immediate
// ("run now") manual run of a CronJob.
export const RUN_NOW_ANNOTATION = "krci.kubernetes.io/run-now";
