import * as React from 'react';

const steps = [
];

export default function Onboarding({run, onCompleted}) {
  React.useEffect(() => {
    if (run) {
      const driver = window.driver.js.driver;

      const driverObj = driver({
        showProgress: true,
        steps: [
          { popover: { title: 'DiSCePT', description: 'DiSCePT is a nice tool. But we need to write the documentation!' } },
          { element: '#discept-file-uploader', popover: { title: 'Title', description: 'Description' } },
          { element: '#step-1', popover: { title: 'Title', description: 'Description' } },
          { element: '#step-2', popover: { title: 'Title', description: 'Description' } },
          { element: '#step-3', popover: { title: 'Title', description: 'Description' } },
        ],
        onDestroyStarted: () => {
          onCompleted();
          driverObj.destroy();
        }
      });

      driverObj.drive();
    }
  }, [run]);

  return <></>;
}
