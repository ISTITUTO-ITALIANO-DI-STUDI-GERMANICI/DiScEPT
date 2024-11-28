// Import React library
import * as React from "react";

// Initialize an empty array for steps (this can be overridden by passed props)
const steps = [];

// Onboarding Component - A guided user onboarding component that uses the 'driver.js' library for step-by-step tutorials.
export default function Onboarding({ run, onCompleted, steps }) {
  // useEffect hook triggers when the 'run' prop changes
  React.useEffect(() => {
    // If 'run' is true, start the onboarding sequence
    if (run) {
      // Access the 'driver.js' library, which is assumed to be globally available through 'window.driver.js'
      const driver = window.driver.js.driver;

      // Configure the driver object for onboarding steps
      const driverObj = driver({
        showProgress: true, // Displays progress indicator for onboarding steps
        steps, // Steps array detailing each step in the onboarding process
        onDestroyStarted: () => {
          // Callback triggered when the onboarding sequence is ending
          onCompleted(); // Calls 'onCompleted' callback (prop) when onboarding completes
          driverObj.destroy(); // Cleans up driver instance to ensure no memory leaks or leftover instances
        },
      });

      // Starts the onboarding sequence
      driverObj.drive();
    }
  }, [run]); // Dependencies array - effect runs whenever 'run' changes

  // Renders an empty fragment as this component doesn't produce any visible elements on the page
  return <></>;
}
