import makeStyles from "@mui/styles/makeStyles";

export const useStyles = makeStyles((theme) => ({
  dialogContent: {
    display: "flex",
    flexWrap: "nowrap",
    gap: theme.typography.pxToRem(20),
    padding: `${theme.typography.pxToRem(8)} ${theme.typography.pxToRem(20)} ${theme.typography.pxToRem(8)} 0`,
  },
  dialogContentTabs: {
    width: "20%",
    flexShrink: 0,
    position: "sticky",
    top: 0,

    "& .MuiTab-wrapper": {
      alignItems: "flex-start",
    },
  },
  dialogContentForm: {
    flexGrow: 1,
  },
}));
