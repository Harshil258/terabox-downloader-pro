// Import config first to ensure console logs are suppressed from the start
// Direct import to force execution of the module's side effects
import { __ENSURE_IMPORT__ } from './config';
import config from './config';
import setupSnapSaveState from './setupProxy';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { hydrate, render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

// Initialize the setupProxy for react-snap
setupSnapSaveState();

// Logger that respects DEBUG_MODE
const logger = {
  log: (...args: unknown[]): void => {
    if (config.DEBUG_MODE) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (config.DEBUG_MODE) {
      console.error(...args);
    }
  }
};

// Global CORS interceptor
// This will ensure all fetch requests are handled properly
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [resource, config] = args;
  
  // TeraBox-related resources that might need CORS handling
  const needsCors = typeof resource === 'string' && (
    resource.includes('mdisplay.com') || 
    resource.includes('terabox.com') || 
    resource.includes('temp-gmail.site') ||
    (resource.startsWith('/api/') && !resource.startsWith('/api/proxy'))
  );
  
  if (needsCors) {
    logger.log('[CORS Interceptor] Handling request:', resource);
    // Apply CORS for API requests too, make sure we preserve the HTTP method
    const fetchOptions = {
      ...config,
      mode: 'cors' as RequestMode,
      credentials: 'include' as RequestCredentials,
      headers: {
        ...config?.headers,
        'Origin': window.location.origin,
        'Referer': window.location.origin
      }
    };
    
    try {
      // First attempt with CORS settings
      return await originalFetch(resource, fetchOptions);
    } catch (error) {
      logger.error('[CORS Interceptor] Request failed, trying alternative approach', error);
      // Fall back to the original request
      return originalFetch(...args);
    }
  }
  
  // For all other requests, proceed normally
  return originalFetch(...args);
};

// Error fallback component
const ErrorFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 px-4 text-center">
    <h2 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h2>
    <p className="text-red-600 mb-6">An unexpected error has occurred. Please try refreshing the page.</p>
    <button
      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      onClick={() => window.location.reload()}
    >
      Refresh Page
    </button>
  </div>
);

const rootElement = document.getElementById('root');

const AppWithProviders = () => (
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <HelmetProvider>
          <App />
          <Toaster position="top-center" />
        </HelmetProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// If the document has already been processed by react-snap
if (rootElement?.hasAttribute('data-server-rendered')) {
  hydrate(<AppWithProviders />, rootElement);
} else {
  // For development and regular client-side rendering
  const root = ReactDOM.createRoot(rootElement!);
  root.render(<AppWithProviders />);
}
