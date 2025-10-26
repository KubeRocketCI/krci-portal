import { Tabs as MuiTabs, Tab } from "@mui/material";
import { TabPanel } from "../../../../components/TabPanel";
import { useStyles } from "./styles";
import { TabsProps } from "./types";

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
};

export const Tabs = ({ tabs, activeTabIdx, handleChangeTab }: TabsProps) => {
  const classes = useStyles();

  return (
    <>
      <MuiTabs
        value={activeTabIdx}
        onChange={handleChangeTab}
        indicatorColor={"primary"}
        textColor={"primary"}
        className={classes.tabs}
      >
        {tabs.map(({ label, icon, disabled = false, onClick }, idx) => (
          <Tab
            key={`tab::${idx}`}
            label={label}
            disabled={disabled}
            icon={icon}
            onClick={onClick}
            {...a11yProps(idx)}
          />
        ))}
      </MuiTabs>
      {tabs.map(({ component }, idx) => (
        <TabPanel key={`tab::${idx}`} value={activeTabIdx} index={idx}>
          {component}
        </TabPanel>
      ))}
    </>
  );
};
