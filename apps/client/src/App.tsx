import { QueryClientProvider } from "@tanstack/react-query";
import BasicLayout from "./core/components/BasicLayout";
import { ErrorBoundary } from "./core/components/ErrorBoundary";
import { queryClient } from "./core/clients/queryClient";
import { AuthProvider } from "./core/auth/provider";
import { TRPCProvider } from "./core/providers/trpc";
import { SubscriptionsProvider } from "./core/providers/subscriptions";
import AppRouter from "./core/router/components/AppRouter";
import { ToursProvider } from "./modules/tours";

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TRPCProvider>
            <SubscriptionsProvider>
              <BasicLayout>
                <ToursProvider>
                  <AppRouter />
                </ToursProvider>
              </BasicLayout>
            </SubscriptionsProvider>
          </TRPCProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
