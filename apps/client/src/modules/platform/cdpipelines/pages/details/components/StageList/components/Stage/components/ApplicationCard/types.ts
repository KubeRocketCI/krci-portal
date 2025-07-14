import { ViewMode } from "@/core/providers/ViewMode/types";
import { Stage, Application, Codebase } from "@my-project/shared";

type Pod = object;

export interface ApplicationCardProps {
  stage: Stage;
  application: Codebase;
  argoApplication: Application;
  QuickLinksURLS: Record<string, string>;
  stagePods: Pod[] | null;
  viewMode: ViewMode;
}
