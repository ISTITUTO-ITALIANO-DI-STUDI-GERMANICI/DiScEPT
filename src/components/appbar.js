// Import necessary modules from React and Material-UI
import * as React from "react";
import { styled } from "@mui/material/styles"; // Allows custom styling for Material-UI components
import AppBar from "@mui/material/AppBar"; // Material-UI AppBar component, used to create the top navigation bar
import Box from "@mui/material/Box"; // Box component for layout structure
import Toolbar from "@mui/material/Toolbar"; // Toolbar component, aligns content within the AppBar
import CloudUploadIcon from "@mui/icons-material/CloudUpload"; // Icon representing file upload
import IconButton from "@mui/material/IconButton"; // IconButton component for interactive icons
import HelpIcon from "@mui/icons-material/Help"; // Help icon, typically for an assistance or info button

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
export default function DisceptAppBar({ fileUploaded, onHelp }) {
  // Handles file upload event
  // Checks that only one file is selected, then triggers the fileUploaded callback with the selected file
  const fileUpload = (e) => {
    if (e.target.files.length !== 1) {
      return; // If no files or multiple files selected, do nothing
    }
    fileUploaded(e.target.files[0]); // Passes the selected file to the fileUploaded callback
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box
          component="img"
          sx={{ height: 50 }}
          alt="DiScEPT"
          src="assets/logo.png"
        />

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: { xs: "none", md: "flex" } }}>
          <IconButton
            id="discept-file-uploader"
            component="label"
            size="large"
            aria-label="upload file"
            color="inherit"
          >
            <CloudUploadIcon />
            <VisuallyHiddenInput type="file" onChange={fileUpload} />
          </IconButton>

          <IconButton
            id="help"
            component="label"
            size="large"
            aria-label="help"
            color="inherit"
            onClick={onHelp}
          >
            <HelpIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
