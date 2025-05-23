import { createTheme, Theme } from "@mui/material";
import { green, orange, red, grey } from "@mui/material/colors";

declare module "@mui/material/styles/createPalette.d" {
  interface Palette {
    success: PaletteColor;
    sidebarLink: {
      [propName: string]: unknown;
    };
    [propName: string]: unknown;
  }
  interface PaletteOptions {
    success?: PaletteColorOptions;
    sidebarLink: {
      [propName: string]: unknown;
    };
    [propName: string]: unknown;
  }
}

declare module "@mui/styles/defaultTheme" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DefaultTheme extends Theme {}
}

const mainColor = "#0094FF";
const darkMainColor = "#002446";
const darkSecondaryColor = "#596D80";
const purplePrimaryColor = "#EFEFFF";
export const purpleSecondaryColor = "#F8F9FF";

const commonRules = {
  // @todo: Remove this once we have tested and fixed the theme for the new breakpoints.
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  palette: {
    primary: {
      contrastText: "#fff",
      main: mainColor,
      dark: darkMainColor,
    },
    secondary: {
      light: purpleSecondaryColor,
      main: purplePrimaryColor,
      dark: darkSecondaryColor,
    },
    primaryColor: "#000",
    success: {
      light: "#f8fff0",
      main: green["800"],
      ...green,
    },
    warning: {
      main: "rgb(196, 69, 0)", // orange
      light: orange["50"],
      ...orange,
    },
    squareButton: {
      background: "#f5f5f5",
    },
    sidebarLink: {
      color: darkMainColor,
      main: {
        selected: {
          color: "#fff",
          backgroundColor: mainColor,
        },
        color: darkMainColor,
      },
      selected: {
        color: mainColor,
        backgroundColor: "unset",
      },
      hover: {
        color: darkMainColor,
        backgroundColor: "#0094FF0D",
      },
    },
    clusterChooser: {
      button: {
        color: "#fff",
        background: "#000",

        hover: {
          background: "#605e5c",
        },
      },
    },
    sidebarButtonInLinkArea: {
      color: "#fff",
      primary: {
        background: mainColor,
      },
      hover: {
        background: darkMainColor,
      },
    },
    home: {
      status: {
        error: red["800"],
        success: "#107C10",
        warning: orange["50"],
        unknown: grey["800"],
      },
    },
    sidebarBg: "#242424",
    error: {
      main: red["800"],
      light: red["50"],
    },
    resourceToolTip: {
      color: "rgba(0, 0, 0, 0.87)",
    },
    normalEventBg: "#F0F0F0",
    chartStyles: {
      defaultFillColor: grey["300"],
      labelColor: "#000",
    },
    metadataBgColor: "#f3f2f1",
    headerStyle: {
      normal: {
        fontSize: "1.8rem",
        fontWeight: "700",
      },
      main: {
        fontSize: "1.87rem",
        fontWeight: "700",
      },
      subsection: {
        fontSize: "1.85rem",
        fontWeight: "700",
      },
      label: {
        fontSize: "1.6rem",
        paddingTop: "1rem",
      },
    },
    tables: {
      head: {
        background: "#faf9f8",
        color: "#242424",
      },
      body: {
        background: "#fff",
      },
    },
    notificationBorderColor: "rgba(0,0,0,0.12)",
    background: {
      default: "#fff",
    },
  },
  typography: {
    fontFamily: ["Roboto", "sans-serif"].join(", "),
    h1: {
      fontWeight: 700,
      fontSize: "1.87rem",
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@global": {
          "@media (prefers-reduced-motion: reduce)": {
            "*": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        variant: "standard" as "filled" | "outlined" | "standard",
      },
    },
    MuiFormControl: {
      defaultProps: {
        variant: "standard" as "filled" | "outlined" | "standard",
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "standard" as "filled" | "outlined" | "standard",
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "0.875rem",
          backgroundColor: "#fff",
          boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
          color: "#000",
          padding: "0.625rem 1rem",
          maxWidth: "500px",
        },
        arrow: {
          boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
          color: "#fff",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#f5f5f5",
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        size: "medium" as "medium" | "large" | "small" | undefined,
      },
      styleOverrides: {
        colorPrimary: {
          color: "#000",
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "#0078D4",
        },
      },
      defaultProps: {
        underline: "hover" as "always" | "hover" | "none",
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: mainColor,
            color: "#fff",
          },
          "&:hover": {
            backgroundColor: mainColor,
            color: "#fff",

            "& .MuiListItemIcon-root": {
              color: "#fff",
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: darkMainColor,
          "&.Mui-selected": {
            color: "#fff",
          },
        },
      },
    },
  },
};

export const lightTheme = createTheme(commonRules);

export const darkTheme = createTheme({
  ...commonRules,
  palette: {
    ...commonRules.palette,
    tables: {
      head: {
        background: "#000",
        color: "#aeaeae",
      },
      body: {
        background: "#1B1A19",
      },
    },
    primary: {
      contrastText: "#000",
      main: "#4B99EE",
    },
    squareButton: {
      background: "#424242",
    },
    primaryColor: "#fff",
    chartStyles: {
      defaultFillColor: "rgba(20, 20, 20, 0.1)",
      fillColor: "#929191",
      labelColor: "#fff",
    },
    success: {
      light: green["800"],
      main: green["50"],
      ...green,
    },
    warning: {
      main: "rgb(255 181 104)", // orange
      light: "rgba(255, 152, 0, 0.15)",
      ...orange,
    },
    error: {
      main: red["800"],
      light: "rgba(244, 67, 54, 0.2)",
    },
    home: {
      status: {
        error: "#E37D80",
        success: "#54B054",
        warning: "#FEEE66",
        unknown: "#D6D6D6",
      },
    },
    normalEventBg: "#333333",
    metadataBgColor: "#333",
    resourceToolTip: {
      color: "rgba(255, 255, 255, 0.87)",
    },
    clusterChooser: {
      button: {
        color: "#fff",
        background: "#605e5c",

        hover: {
          background: "#3B3A39",
        },
      },
    },
    sidebarLink: {
      ...commonRules.palette.sidebarLink,
      selected: {
        color: mainColor,
        backgroundColor: "unset",
      },
    },
    sidebarBg: "#000",
    notificationBorderColor: "rgba(255,255,255,0.12)",
    mode: "dark",
    // type: 'dark',
    background: {
      default: "#1f1f1f",
      paper: "#1f1f1f",
    },
  },
  components: {
    ...commonRules.components,
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          ...commonRules.components.MuiTooltip.styleOverrides.tooltip,
          backgroundColor: "#000",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          colorPrimary: {
            backgroundColor: "#000",
          },
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        size: "medium" as "medium" | "large" | "small" | undefined,
      },
      styleOverrides: {
        colorPrimary: {
          color: "#fff",
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "#6CB6F2",
        },
      },
      defaultProps: {
        underline: "hover" as "always" | "hover" | "none",
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          colorPrimary: {
            "&&.Mui-checked": {
              color: "#4b99ee",
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        textColorPrimary: {
          "&&.Mui-selected": {
            color: "#fff",
            borderBottomColor: "#fff",
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          indicator: {
            backgroundColor: "#fff",
          },
        },
      },
    },
  },
});
