import React from "react";
import { Stage } from "@my-project/shared";

export interface FormActionsProps {
  setFormActiveTabIdx: React.Dispatch<React.SetStateAction<number>>;
  formActiveTabIdx: number;
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  stages: Stage[];
}
