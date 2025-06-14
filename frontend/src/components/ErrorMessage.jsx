import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorMessage:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6 text-center">
              The application encountered an error. Please try refreshing the page.
            </p>
            {this.props.showDetails && (
              <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto text-sm">
                <p className="font-mono text-red-600">{this.state.error?.toString()}</p>
                <p className="font-mono text-gray-700 mt-2">
                  {this.state.errorInfo?.componentStack}
                </p>
              </div>
            )}
            <div className="flex justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorMessage;