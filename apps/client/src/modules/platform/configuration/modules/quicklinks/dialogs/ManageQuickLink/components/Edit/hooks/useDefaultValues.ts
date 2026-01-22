import React from "react";
import { NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import type { ManageQuickLinkFormValues } from "../../../types";

export const useDefaultValues = (): ManageQuickLinkFormValues => {
  const {
    props: { quickLink },
  } = useCurrentDialog();

  return React.useMemo(
    () => ({
      [NAMES.ICON]: quickLink?.spec.icon ?? "",
      [NAMES.NAME]: quickLink?.metadata.name ?? "",
      [NAMES.URL]: quickLink?.spec.url ?? "",
      [NAMES.VISIBLE]: quickLink?.spec.visible ?? true,
    }),
    [quickLink]
  );
};
