import { Stage } from "@my-project/shared";

export interface EnvironmentCardProps {
  stage: Stage;
  isExpanded: boolean;
  onToggleExpand: () => void;
}
