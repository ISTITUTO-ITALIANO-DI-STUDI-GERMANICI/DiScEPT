// Import necessary modules from React and Material-UI
import * as React from "react";
import { styled } from "@mui/material/styles";      // Allows custom styling for Material-UI components
import AppBar from "@mui/material/AppBar";          // Material-UI AppBar component, used to create the top navigation bar
import Box from "@mui/material/Box";                // Box component for layout structure
import Toolbar from "@mui/material/Toolbar";        // Toolbar component, aligns content within the AppBar
import CloudUploadIcon from "@mui/icons-material/CloudUpload";  // Icon representing file upload
import IconButton from "@mui/material/IconButton";  // IconButton component for interactive icons
import HelpIcon from "@mui/icons-material/Help";    // Help icon, typically for an assistance or info button

// Hidden input styled component for file upload input, visually hidden but still accessible for screen readers
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",            // Hides element visually by clipping it
  clipPath: "inset(50%)",           // Further hides input with CSS inset method
  height: 1,                        // Minimal height for hidden input
  overflow: "hidden",               // Prevents overflow content from being shown
  position: "absolute",             // Position element absolutely to hide it visually
  bottom: 0,                        // Align to bottom
  left: 0,                          // Align to left
  whiteSpace: "nowrap",             // Prevents wrapping of text (if any)
  width: 1                          // Minimal width for hidden input
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
    <AppBar position="static"> {/* Static positioning for AppBar */}
      <Toolbar> {/* Toolbar for internal layout of AppBar components */}
        {/* Logo Image */}
        <Box
          component="img"
          sx={{ height: 50 }}   // Sets logo height
          alt="DiScEPT"         // Accessible description for screen readers
          src="assets/logo.png" // Source of the logo image
        />

        {/* Spacer box to push items to the right */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Container for file upload and help icons, visible on medium screens and larger */}
        <Box sx={{ display: { xs: "none", md: "flex" } }}>
          
          {/* File Upload Button with Hidden Input */}
          <IconButton
            id="discept-file-uploader"          // Unique identifier for testing/accessibility
            component="label"                   // Renders the button as a label for file input
            size="large"                        // Large button size for accessibility
            aria-label="upload file"            // Accessibility label for screen readers
            color="inherit"                     // Inherits color from AppBar
          >
            <CloudUploadIcon />                 // File upload icon
            <VisuallyHiddenInput type="file" onChange={fileUpload} /> {/* Hidden input for file selection */}
          </IconButton>

          {/* Help Icon Button */}
          <IconButton
            id="help"                           // Unique identifier for testing/accessibility
            component="label"                   // Renders button as a label for flexibility
            size="large"                        // Large button size for accessibility
            aria-label="help"                   // Accessibility label for screen readers
            color="inherit"                     // Inherits color from AppBar
            onClick={onHelp}                    // Trigger onHelp callback when clicked
          >
            <HelpIcon />                        // Help icon to indicate assistance/info
          </IconButton>

        </Box>
      </Toolbar>
    </AppBar>
  );
}
