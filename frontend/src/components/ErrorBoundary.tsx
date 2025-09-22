import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div>
            <h2 className="text-2xl font-semibold mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-medium-grey">
              Veuillez rafraîchir la page ou réessayer plus tard.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
