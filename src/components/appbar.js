import * as React from "react";
import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import IconButton from "@mui/material/IconButton";
import HelpIcon from "@mui/icons-material/Help";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export default function DisceptAppBar({ fileUploaded, onHelp }) {
  const fileUpload = (e) => {
    if (e.target.files.length !== 1) {
      return;
    }

    fileUploaded(e.target.files[0]);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          DiSCePT
        </Typography>

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
