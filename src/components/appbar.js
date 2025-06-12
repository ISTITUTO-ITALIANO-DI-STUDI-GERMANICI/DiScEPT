// Import necessary modules from React and Material-UI
import * as React from "react";
import { styled } from "@mui/material/styles"; // Allows custom styling for Material-UI components
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Switch,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload"; // Icon representing file upload
import HelpIcon from "@mui/icons-material/Help"; // Help icon, typically for an assistance or info button
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExistDBSync from "./existdbsync.js";

// Hidden input styled component for file upload input, visually hidden but still accessible for screen readers
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)", // Hides element visually by clipping it
  clipPath: "inset(50%)", // Further hides input with CSS inset method
  height: 1, // Minimal height for hidden input
  overflow: "hidden", // Prevents overflow content from being shown
  position: "absolute", // Position element absolutely to hide it visually
  bottom: 0, // Align to bottom
  left: 0, // Align to left
  whiteSpace: "nowrap", // Prevents wrapping of text (if any)
  width: 1, // Minimal width for hidden input
});

// DisceptAppBar Component - A custom AppBar component with logo, file upload, and help button
export default function DisceptAppBar({
  fileUploaded,
  onHelp,
  darkMode,
  toggleDarkMode,
  onToggleStepper,
  stepperOpen,
  onIntro,
}) {
  // Handles file upload event
  // Checks that only one file is selected, then triggers the fileUploaded callback with the selected file
  const fileUpload = (e) => {
    if (e.target.files.length !== 1) return;
    fileUploaded(e.target.files[0]); // Passes the selected file to the fileUploaded callback
  };

  return (
    <Box sx={{ mb: 3, px: 2 }}>
      <AppBar
        position="static"
        elevation={1}
        sx={{
          backgroundColor: "#FFFFFF",
          color: "#2E2E2E",
          borderRadius: "0 0 12px 12px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", px: 2 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
            onClick={() => onIntro && onIntro()}
          >
            <img
              src="assets/logo.png"
              alt="Logo"
              style={{ height: 32 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              DiScEPT
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>

            {/* Toggle stepper */}
            {onToggleStepper && (
              <Tooltip title={stepperOpen ? "Nascondi menu" : "Mostra menu"}>
                <IconButton color="inherit" onClick={onToggleStepper}>
                  {stepperOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
              </Tooltip>
            )}

            {/* Upload */}
            <Tooltip title="Upload file">
              <IconButton component="label" color="inherit">
                <CloudUploadIcon />
                <VisuallyHiddenInput
                  type="file"
                  accept=".xml"
                  onChange={fileUpload}
                />
              </IconButton>
            </Tooltip>

            <ExistDBSync />

            {/* Help */}
            <Tooltip title="Aiuto">
              <IconButton id="help" color="inherit" onClick={onHelp}>
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
