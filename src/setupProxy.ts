// This file is used to configure react-snap for pre-rendering
// during the build process to improve SEO

interface Window {
  snapSaveState?: () => void;
}

// Add a property to save the state for react-snap
export const setupSnapSaveState = () => {
  // Add snapSaveState to window
  if (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'production' &&
    !window.hasOwnProperty('snapSaveState')
  ) {
    (window as any).snapSaveState = () => {
      // This function is called by react-snap after rendering
      // We can use it to save the application state for hydration
      const state = {
        // Add any global state you want to hydrate here
        // For example:
        // redux: store.getState(),
        // date: new Date().toISOString(),
      };
      
      return {
        __PRELOADED_STATE__: state,
      };
    };
  }
};

// Run the setup function
setupSnapSaveState();

// Export for usage in main.tsx
export default setupSnapSaveState; 