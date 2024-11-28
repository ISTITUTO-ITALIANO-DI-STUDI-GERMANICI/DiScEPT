// Import necessary modules from React and Material UI
import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import StepContent from "@mui/material/StepContent";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

// DisceptStepper Component - Renders a vertical stepper with a sequence of steps, displaying each step's label and description. Allows navigation between steps by clicking on labels.
export default function DisceptStepper({ steps, onChange }) {
  // State for tracking the currently active step
  const [activeStep, setActiveStep] = React.useState(0);

  // Function to activate a specific step and trigger the onChange event
  const activate = (index) => {
    setActiveStep(index);
    onChange(index); // Notify parent component about the change in active step
  };

  return (
    <Box sx={{ maxWidth: 400 }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label} id={"step-" + index}>
            <StepLabel>
              <Button variant="text" onClick={() => activate(index)}>
                {step.label}
              </Button>
            </StepLabel>
            <StepContent>
              <Typography>{step.description}</Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
