import { QueryClientProvider } from "@tanstack/react-query";
import BasicLayout from "./core/components/BasicLayout";
import { ErrorBoundary } from "./core/components/ErrorBoundary";
import { queryClient } from "./core/clients/queryClient";
import { AuthProvider } from "./core/auth/provider";
import AppRouter from "./core/router/components/AppRouter";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BasicLayout>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BasicLayout>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
