import React, { Suspense } from "react";
import { DialogContext } from "./context";
import { DialogProps, DialogProviderState } from "./types";

export const DialogContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogs, setDialogs] = React.useState<DialogProviderState>({});

  const closeDialog = React.useCallback((key: string) => {
    setDialogs((prevDialogs) => {
      if (prevDialogs[key]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _, ...rest } = prevDialogs;
        return rest;
      }
      return prevDialogs;
    });
  }, []);

  const setDialog = React.useCallback(
    <Props,>(component: React.ComponentType<DialogProps<Props>>, props: Props) => {
      const key = component.displayName || component.name;
      const Component = component;

      const entry: DialogProviderState[string] = {
        key,
        renderDialog: () => (
          <Component
            props={props}
            state={{
              open: true,
              closeDialog: () => closeDialog(key),
              // Re-registers this entry. Same result as a second `setDialog` with these arguments.
              openDialog: () => setDialogs((prevDialogs) => ({ ...prevDialogs, [key]: entry })),
            }}
          />
        ),
      };

      setDialogs((prevDialogs) => ({ ...prevDialogs, [key]: entry }));
    },
    [closeDialog]
  );

  const mapEntries = React.useMemo(
    () =>
      Object.entries(dialogs).map(([key, { renderDialog }]) => (
        <Suspense key={key} fallback={"Loading..."}>
          {renderDialog()}
        </Suspense>
      )),
    [dialogs]
  );

  // Stable identities: `setDialog` and `closeDialog` never change, so consumers may list them as deps.
  const value = React.useMemo(() => ({ dialogs, setDialog, closeDialog }), [dialogs, setDialog, closeDialog]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {mapEntries}
    </DialogContext.Provider>
  );
};
