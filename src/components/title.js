import React from "react";
import { Box, Typography } from "@mui/material";

export default function Title({ title, sx = {} }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 3,
        ...sx,
      }}
    >
      <img
        src="assets/logo.png"
        alt="DiScEPT"
        style={{ height: 48, width: "auto" }}
      />
      <Typography variant="h3" component="h1" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
  );
}
