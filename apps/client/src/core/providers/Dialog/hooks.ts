import { useCallback, useContext } from "react";
import { DialogContext } from "./context";
import { DialogProps } from "./types";

export const useDialogContext = () => useContext(DialogContext);

/** Returns a stable opener while `component` is stable. Safe as a memo or callback dependency. */
export const useDialogOpener = <Props>(component: React.ComponentType<DialogProps<Props>>) => {
  const { setDialog } = useDialogContext();

  return useCallback((props: Props) => setDialog(component, props), [setDialog, component]);
};
