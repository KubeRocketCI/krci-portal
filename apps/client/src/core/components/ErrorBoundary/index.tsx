import { Component, ErrorInfo, ReactNode } from "react";
import { CriticalError } from "../CriticalError";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <CriticalError
          title="Application Error"
          message="An unexpected error occurred in the application. Please try refreshing the page or contact support if the problem persists."
          error={this.state.error}
          showActions={true}
        />
      );
    }

    return this.props.children;
  }
}
