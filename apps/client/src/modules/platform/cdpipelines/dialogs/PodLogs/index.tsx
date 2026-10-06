import { createLazyDialog } from "@/core/providers/Dialog/createLazyDialog";
import { DIALOG_NAME } from "./constants";

export const PodLogsDialog = createLazyDialog(DIALOG_NAME, () => import("./PodLogsDialog"), "PodLogsDialog");
