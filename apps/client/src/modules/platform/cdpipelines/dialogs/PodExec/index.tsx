import { createLazyDialog } from "@/core/providers/Dialog/createLazyDialog";
import { DIALOG_NAME } from "./constants";

export const PodExecDialog = createLazyDialog(DIALOG_NAME, () => import("./PodExecDialog"), "PodExecDialog");
