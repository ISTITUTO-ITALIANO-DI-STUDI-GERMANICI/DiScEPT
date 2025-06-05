import React from "react";
import { Box, Typography, Link } from "@mui/material";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: 4,
        px: 2,
        py: 2,
        textAlign: "center",
        backgroundColor: "background.paper",
        color: "text.secondary",
        borderTop: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">
        Realizzato con il supporto dell{' '}
        <Link
          href="https://www.studigermanici.it"
          target="_blank"
          rel="noopener"
        >
          Istituto Italiano di Studi Germanici
        </Link>
      </Typography>
      <Typography variant="body2">
        Via Calandrelli 25 - 00153 Roma
      </Typography>
      <Typography variant="body2">© 2024 Istituto Italiano di Studi Germanici</Typography>
    </Box>
  );
}
