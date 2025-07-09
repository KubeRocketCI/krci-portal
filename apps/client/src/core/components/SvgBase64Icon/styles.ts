import makeStyles from "@mui/styles/makeStyles";

export const useStyles = (width: number, height: number) =>
  makeStyles((theme) => ({
    icon: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "auto",
      width: theme.typography.pxToRem(width),
      height: theme.typography.pxToRem(height),

      "& img": {
        width: "100%",
        height: "100%",
      },
    },
  }))();
