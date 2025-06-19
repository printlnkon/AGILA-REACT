import React from "react";
import { AlertTriangle } from "lucide-react";

class ErrorMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorMessage:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md w-full">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-gray-800">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              Sorry, something went wrong there. Try again.
            </p>
            {this.props.showDetails && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto text-sm">
                <p className="font-mono text-red-600">
                  {this.state.error?.toString()}
                </p>
                <p className="font-mono text-gray-700">
                  {this.state.errorInfo?.componentStack}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorMessage;
