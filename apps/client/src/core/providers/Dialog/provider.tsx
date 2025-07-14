import React, { Suspense } from "react";
import { DialogContext } from "./context";
import { DialogProps, DialogProviderState } from "./types";

export const DialogContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogs, setDialogs] = React.useState<DialogProviderState>({});

  const setDialog = <Props,>(component: React.ComponentType<DialogProps<Props>>, props: Props) => {
    const key = component.displayName || component.name;

    const renderDialog = () => {
      const Component = component;
      return (
        <Component
          props={props}
          state={{
            open: true,
            closeDialog: () => closeDialog(key),
            openDialog: () => setDialog(Component, props),
          }}
        />
      );
    };

    setDialogs((prevDialogs) => ({
      ...prevDialogs,
      [key]: {
        renderDialog,
        key,
      },
    }));
  };

  const closeDialog = (key: string) => {
    setDialogs((prevDialogs) => {
      if (prevDialogs[key]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _, ...rest } = prevDialogs;
        return rest;
      }
      return prevDialogs;
    });
  };

  const mapEntries = React.useMemo(
    () =>
      Object.entries(dialogs).map(([key, { renderDialog }]) => (
        <Suspense key={key} fallback={"Loading..."}>
          {renderDialog()}
        </Suspense>
      )),
    [dialogs]
  );

  return (
    <DialogContext.Provider value={{ dialogs, setDialog, closeDialog }}>
      {children}
      {mapEntries}
    </DialogContext.Provider>
  );
};
