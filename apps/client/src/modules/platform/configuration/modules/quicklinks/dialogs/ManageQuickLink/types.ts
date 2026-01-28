import { DialogProps } from "@/core/providers/Dialog/types";
import { QuickLink } from "@my-project/shared";
import { NAMES } from "./constants";

export type ManageQuickLinkDialogProps = DialogProps<{
  quickLink?: QuickLink;
  isSystem?: boolean;
  handleApply?: ({ quickLinkData }: { quickLinkData: QuickLink }) => void;
}>;

export { NAMES } from "./constants";

export type ManageQuickLinkFormValues = {
  [NAMES.ICON]: string;
  [NAMES.NAME]: string;
  [NAMES.URL]: string;
  [NAMES.VISIBLE]: boolean;
};
