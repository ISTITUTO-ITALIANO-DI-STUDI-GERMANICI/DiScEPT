import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import data from "../Data.js";
import { getFullViewerCode } from "./viewerCode.js";

/**
 * Embeds the same standalone HTML viewer used in FinalView ("Open HTML Viewer")
 * inside an iframe. The ?embed=1 query param tells the viewer to skip the
 * title/author header and show only the alignment content.
 */
export default function AlignmentViewer() {
  const [blobUrl, setBlobUrl] = React.useState(null);

  React.useEffect(() => {
    const teiContent = data.generateTEI();

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TEI Alignment Viewer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>
    // Injected by AlignmentViewer: tells the web component to skip the decorative header
    window.__DISCEPT_EMBED__ = true;
  </script>
</head>
<body style="margin:0;padding:0;">
  <tei-alignment-viewer></tei-alignment-viewer>
  <script type="text/xml" id="embedded-tei">
${teiContent}
  </script>
  <script type="module">
    ${getFullViewerCode()}
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    // Cleanup blob URL on unmount or re-render
    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  if (!blobUrl) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 4 }}>
        <CircularProgress size={24} />
        <Typography color="text.secondary">Loading viewer…</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 220px)",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <iframe
        src={blobUrl}
        title="TEI Alignment Viewer"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
        sandbox="allow-scripts allow-same-origin"
      />
    </Box>
  );
}