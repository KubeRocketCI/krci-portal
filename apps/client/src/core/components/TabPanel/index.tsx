import { tabPanelClasses } from "./styles";
import { TabPanelProps } from "./types";

export const TabPanel = ({ children, value, index, shouldRender = true, ...other }: TabPanelProps) => {

  const isActive = value === index;
  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      className={tabPanelClasses}
      {...other}
    >
      {shouldRender && isActive ? children : null}
    </div>
  );
};
