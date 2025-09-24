import makeStyles from "@mui/styles/makeStyles";

export const useStyles = makeStyles((theme) => ({
  serviceItemIcon: {
    display: "block",
    width: theme.typography.pxToRem(50),
    height: theme.typography.pxToRem(50),

    "& img": {
      width: "100%",
      height: "100%",
    },
  },
}));
