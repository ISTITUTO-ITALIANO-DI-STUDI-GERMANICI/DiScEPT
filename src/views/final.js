import * as React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import Title from '../components/title.js';
import data from "../Data.js";
import { getFullViewerCode } from '../components/viewerCode.js';

function FinalView() {
  function downloadTEI() {
    let blob = new Blob([data.generateTEI()], { type: "octet/stream" });

    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "file.tei";
    a.style.display = "none";

    document.body.append(a);

    a.click();
  }

  function downloadTEIPublisherApp() {
    // TODO
  }

  function showHTMLViewer() {
    // Generate TEI content
    const teiContent = data.generateTEI();

    // Create HTML with embedded TEI (same as download but display instead)
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TEI Alignment Viewer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <tei-alignment-viewer></tei-alignment-viewer>
  <script type="text/xml" id="embedded-tei">
${teiContent}
  </script>
  <script type="module">
    ${getFullViewerCode()}
  </script>
</body>
</html>`;

    // Create blob URL and open in new window
    const blob = new Blob([htmlContent], { type: "text/html" });
    const blobURL = URL.createObjectURL(blob);

    // Open the blob URL directly in a new window
    const viewerWindow = window.open(blobURL, "_blank");

    // Clean up blob URL after a delay (give time for window to load)
    if (viewerWindow) {
      setTimeout(() => {
        URL.revokeObjectURL(blobURL);
      }, 5000);
    }
  }

  function downloadHTMLWithViewer() {
    // Generate TEI content
    const teiContent = data.generateTEI();

    // Create HTML with embedded TEI
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TEI Alignment Viewer</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <tei-alignment-viewer></tei-alignment-viewer>
  <script type="text/xml" id="embedded-tei">
${teiContent}
  </script>
  <script type="module">
    ${getFullViewerCode()}
  </script>
</body>
</html>`;

    // Download as HTML file
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tei-viewer.html";
    a.style.display = "none";
    document.body.append(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Box>
      <Title title="Finalize your digital edition" />

      <p>
        You can download the file in TEI/XML or also in RDF/XML. Both formats
        provide structured data, but TEI/XML focuses on textual encoding for
        research, while RDF/XML emphasizes metadata and relationships. Choose
        the format that best suits your needs for data analysis or digital
        humanities projects.
      </p>
      <Button id="download-tei" variant="contained" onClick={downloadTEI}>
        TEI/XML DiScEPT file
      </Button>

      <p>
        You can also choose to publish your digital scholarly edition using the
        TEI Publisher tool. This tool offers a user-friendly interface for
        displaying and managing TEI-encoded texts, ensuring that your edition is
        accessible and well-presented. It simplifies the process, making digital
        publication more efficient and widely available.
      </p>
      <Button id="download-publisher" variant="contained" onClick={downloadTEIPublisherApp}>
        TEI-Publisher app
      </Button>

      <p>
        View your aligned TEI documents in an interactive HTML viewer or download
        a standalone HTML file. The viewer displays parallel texts with visual
        alignment highlighting, making it easy to explore connections between
        documents. Perfect for presenting your digital scholarly edition online.
      </p>
      <Button id="show-html" variant="contained" onClick={showHTMLViewer} sx={{ mr: 2 }}>
        Open HTML Viewer
      </Button>
      <Button id="download-html" variant="outlined" onClick={downloadHTMLWithViewer}>
        Download HTML Viewer
      </Button>
    </Box>
  );
}

const FinalOnboarding = [
  {
    popover: {
      title: "Final section",
      description:
        "Choose how to export your edition: as TEI, a TEI Publisher application, or interactive HTML viewer.",
    },
  },
  {
    element: "#download-tei",
    popover: {
      title: "Download TEI",
      description: "Export the project as a single TEI/XML file.",
    },
  },
  {
    element: "#download-publisher",
    popover: {
      title: "TEI Publisher app",
      description: "Generate a package ready to use with TEI Publisher.",
    },
  },
  {
    element: "#show-html",
    popover: {
      title: "Open HTML Viewer",
      description: "Preview your aligned TEI documents in an interactive viewer.",
    },
  },
  {
    element: "#download-html",
    popover: {
      title: "Download HTML Viewer",
      description: "Download a standalone HTML file with embedded viewer and TEI data.",
    },
  },
];

export { FinalView, FinalOnboarding };
