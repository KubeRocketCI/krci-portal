export const pipelineAnnotations = {
  /** Chart-written, fed to the build/review TriggerTemplates by the krci interceptor.
   *  The portal reads it directly so runs started outside the webhook flow match. */
  serviceAccount: "app.edp.epam.com/service-account",
} as const;
