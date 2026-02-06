import { errorBase64Icon } from "./constants";
import { getIconClasses, getIconStyle } from "./styles";
import { sanitizeSvgBase64 } from "@/core/utils/sanitizeSvg";

export const SvgBase64Icon = ({ width, height, icon }: { width: number; height: number; icon: string }) => {
  const sanitizedIcon = sanitizeSvgBase64(icon);

  return (
    <div className={getIconClasses()} style={getIconStyle(width, height)}>
      <img
        src={`data:image/svg+xml;base64,${sanitizedIcon}`}
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
