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
  IconButton,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

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

const StepperContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: open ? 240 : 16,
  minHeight: "100vh",
  overflow: "visible",
  position: "relative",
  backgroundColor: theme.palette.background.paper,
  padding: open ? theme.spacing(2) : theme.spacing(0.5),
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
  transition: "width 0.2s ease",
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  right: -20,
  transform: "translateY(-50%)",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  zIndex: 1,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledStep = styled(Step)(({ theme, active }) => ({
  backgroundColor: active ? theme.palette.action.hover : "transparent",
  borderRadius: 8,
  padding: "4px 8px",
  marginBottom: 4,
}));

// DisceptStepper Component - Renders a vertical stepper with a sequence of steps, displaying each step's label and description. Allows navigation between steps by clicking on labels.
export default function DisceptStepper({ steps, onChange, onToggle, open }) {
  // State for tracking the currently active step
  const [activeStep, setActiveStep] = React.useState(0);
  const theme = useTheme();

  // Function to activate a specific step and trigger the onChange event
  const activate = (index) => {
    setActiveStep(index);
    onChange(index); // Notify parent component about the change in active step
  };

  return (
    <StepperContainer open={open}>
      <ToggleButton size="small" onClick={onToggle}>
        {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </ToggleButton>
      {open && (
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
      )}
    </StepperContainer>
  );
}
