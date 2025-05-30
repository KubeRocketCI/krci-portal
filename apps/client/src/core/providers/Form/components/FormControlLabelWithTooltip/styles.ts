import { DefaultTheme } from "@mui/styles/defaultTheme";
import makeStyles from "@mui/styles/makeStyles";

export const useStyles = (disabled?: boolean) =>
  makeStyles((theme: DefaultTheme) => ({
    labelWrap: {
      display: "flex",
      alignItems: "center",
      gap: theme.typography.pxToRem(7),
      height: "100%",

      "& svg": {
        pointerEvents: "auto",
        marginBottom: theme.typography.pxToRem(2),
      },
    },
    label: {
      fontSize: theme.typography.pxToRem(14),
      lineHeight: 1,
      color: disabled ? theme.palette.text.disabled : theme.palette.text.primary,
    },
  }))();
