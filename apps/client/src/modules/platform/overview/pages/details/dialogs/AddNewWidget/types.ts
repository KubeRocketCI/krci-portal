import { DialogProps } from "@/core/providers/Dialog/types";
import { WIDGET_TYPE } from "./constants";
import { ValueOf } from "@/core/types/global";

export type AddNewWidgetProps = DialogProps<{
  userWidgets: WidgetConfig[];
  setUserWidgets: (widgets: WidgetConfig[]) => void;
}>;

export type WidgetType = ValueOf<typeof WIDGET_TYPE>;
export type WidgetConfig<T = unknown> = {
  id: string;
  type: WidgetType;
  data: T;
};
