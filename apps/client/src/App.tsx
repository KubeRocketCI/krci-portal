import { QueryClientProvider } from "@tanstack/react-query";
import BasicLayout from "./core/components/BasicLayout";
import { queryClient } from "./core/clients/queryClient";
import { AuthProvider } from "./core/auth/providers/Auth";
import AppRouter from "./core/router/components/AppRouter";
import { lightTheme } from "./core/router/components/themes";
import { StyledEngineProvider, ThemeProvider } from "@mui/material";
import { DialogContextProvider } from "./core/providers/Dialog/provider";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={lightTheme}>
          <BasicLayout>
            <AuthProvider>
              <DialogContextProvider>
                <AppRouter />
              </DialogContextProvider>
            </AuthProvider>
          </BasicLayout>
        </ThemeProvider>
      </StyledEngineProvider>
    </QueryClientProvider>
  );
}

export default App;
