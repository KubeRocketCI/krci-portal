import { WIDGET_TYPE } from "../../dialogs/AddNewWidget/constants";
import { WidgetConfig } from "../../dialogs/AddNewWidget/types";
import { useUserWidgets } from "../../providers/UserWidgets/hooks";
import { AppVersion } from "../AppVersion";

const renderer = (
  widgetConfig: WidgetConfig,
  userWidgets: WidgetConfig[],
  setUserWidgets: (widgets: WidgetConfig[]) => void
) => {
  switch (widgetConfig.type) {
    case WIDGET_TYPE.APP_VERSION:
      return (
        <AppVersion
          widgetConfig={widgetConfig as WidgetConfig<{ appName: string }>}
          userWidgets={userWidgets}
          setUserWidgets={setUserWidgets}
        />
      );
    default:
      return null;
  }
};

export const UserWidgetRenderer = ({ widgetConfig }: { widgetConfig: WidgetConfig }) => {
  const { userWidgets, setUserWidgets } = useUserWidgets();

  return (
    <div className="bg-card h-full overflow-hidden rounded border p-6 shadow-sm">
      {renderer(widgetConfig, userWidgets, setUserWidgets)}
    </div>
  );
};
