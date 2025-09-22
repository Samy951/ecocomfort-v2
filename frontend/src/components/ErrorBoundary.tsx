import React from "react";

type ErrorBoundaryState = { hasError: boolean; error?: unknown };

export default class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    // Optionally log to monitoring service
    console.error("UI ErrorBoundary caught: ", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Une erreur est survenue
            </h2>
            <p className="opacity-80 mb-4">
              Veuillez recharger la page ou réessayer plus tard.
            </p>
            <button
              className="px-4 py-2 bg-main-green text-main-black rounded-lg"
              onClick={() => window.location.reload()}
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
