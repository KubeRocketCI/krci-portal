import { errorBase64Icon } from "./constants";
import { getIconClasses, getIconStyle } from "./styles";

export const SvgBase64Icon = ({ width, height, icon }: { width: number; height: number; icon: string }) => {
  return (
    <div className={getIconClasses()} style={getIconStyle(width, height)}>
      <img
        src={`data:image/svg+xml;base64,${icon}`}
        alt=""
        onError={({ currentTarget }) => {
          currentTarget.onerror = null;
          currentTarget.src = `data:image/svg+xml;base64,${errorBase64Icon}`;
          currentTarget.title = "Icon is broken";
        }}
      />
    </div>
  );
};
