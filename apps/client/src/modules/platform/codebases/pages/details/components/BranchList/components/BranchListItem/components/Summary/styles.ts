import { STATUS_COLOR } from "@/k8s/constants/colors";
import { cn } from "@/core/utils/classname";

export const pipelineRunStatusClasses = "pt-[1px] flex justify-center w-[44px]";

export const labelChipClasses = "h-6 leading-none pt-0.5";

export const labelChipBlueClasses = cn("bg-primary text-white", labelChipClasses);

export const labelChipGreenClasses = cn(`bg-[${STATUS_COLOR.SUCCESS}] text-white`, labelChipClasses);
