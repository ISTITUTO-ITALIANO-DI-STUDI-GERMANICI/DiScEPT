import * as React from "react";

const steps = [];

export default function Onboarding({ run, onCompleted, steps }) {
  React.useEffect(() => {
    if (run) {
      const driver = window.driver.js.driver;

      const driverObj = driver({
        showProgress: true,
        steps,
        onDestroyStarted: () => {
          onCompleted();
          driverObj.destroy();
        },
      });

      driverObj.drive();
    }
  }, [run]);

  return <></>;
}
