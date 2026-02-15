import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Registry from './pages/Registry';
import ConfidenceExplainer from './pages/ConfidenceExplainer';
import SecretsManager from './pages/SecretsManager';

import Configuration from './pages/Configuration';

// Placeholders for other pages
// const Config = () => <div className="text-2xl font-bold">Configuration (Coming Soon)</div>;

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-white bg-gray-900 h-screen">
          <h1 className="text-2xl text-red-500 font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-black p-4 rounded overflow-auto text-sm font-mono text-gray-300">
            {this.state.error?.toString()}
            <br />
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/config" element={<Configuration />} />
            <Route path="/secrets" element={<SecretsManager />} />
            <Route path="/confidence-explainer" element={<ConfidenceExplainer />} />
          </Routes>
        </MainLayout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
