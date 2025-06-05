// Import necessary modules from React and Material UI
import * as React from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 500,
  fontSize: 14,
  padding: "6px 12px",
  borderRadius: 8,
  color: theme.palette.primary.main,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StepperContainer = styled(Box)(({ theme }) => ({
  maxWidth: 400,
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
}));

const StyledStep = styled(Step)(({ theme, active }) => ({
  backgroundColor: active ? theme.palette.action.hover : "transparent",
  borderRadius: 8,
  padding: "4px 8px",
  marginBottom: 4,
}));

// DisceptStepper Component - Renders a vertical stepper with a sequence of steps, displaying each step's label and description. Allows navigation between steps by clicking on labels.
export default function DisceptStepper({ steps, onChange }) {
  // State for tracking the currently active step
  const [activeStep, setActiveStep] = React.useState(0);
  const theme = useTheme();

  // Function to activate a specific step and trigger the onChange event
  const activate = (index) => {
    setActiveStep(index);
    onChange(index); // Notify parent component about the change in active step
  };

  return (
    <StepperContainer>
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <StyledStep key={step.label} active={activeStep === index}>
            <StepLabel>
              <StyledButton onClick={() => activate(index)}>
                {step.label}
              </StyledButton>
            </StepLabel>
            <StepContent>
              <Typography sx={{ color: "text.secondary", mb: 1 }}>
                {step.description}
              </Typography>
            </StepContent>
          </StyledStep>
        ))}
      </Stepper>
    </StepperContainer>
  );
}
