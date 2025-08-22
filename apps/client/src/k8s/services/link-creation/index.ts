import { ArgoCDURLService } from "./argocd";
import { DepTrackURLService } from "./deptrack";
import { GitURLService } from "./git";
import { LoggingURLService } from "./logging";
import { MonitoringURLService } from "./monitoring";
import { SonarQubeURLService } from "./sonar";

export const LinkCreationService = {
  argocd: {
    ...ArgoCDURLService,
  },
  sonar: {
    ...SonarQubeURLService,
  },
  monitoring: {
    ...MonitoringURLService,
  },
  logging: {
    ...LoggingURLService,
  },
  git: {
    ...GitURLService,
  },
  depTrack: {
    ...DepTrackURLService,
  },
};
