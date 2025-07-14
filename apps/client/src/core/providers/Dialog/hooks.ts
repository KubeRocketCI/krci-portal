import { useContext } from "react";
import { DialogContext } from "./context";
import { DialogProps } from "./types";

export const useDialogContext = () => useContext(DialogContext);

export const useDialogOpener = <Props>(component: React.ComponentType<DialogProps<Props>>) => {
  const { setDialog } = useDialogContext();

  return (props: Props) => {
    setDialog(component, props);
  };
};
