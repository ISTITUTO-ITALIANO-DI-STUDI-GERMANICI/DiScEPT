import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import StepContent from "@mui/material/StepContent";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function DisceptStepper({ steps, onChange }) {
  const [activeStep, setActiveStep] = React.useState(0);

  const activate = (index) => {
    setActiveStep(index);
    onChange(index);
  };

  return (
    <Box sx={{ maxWidth: 400 }}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>
              <Button
                variant="text"
                onClick={() => activate(index)}
              >
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
