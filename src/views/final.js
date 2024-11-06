import * as React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import data from "../Data.js";

function FinalView() {
  function downloadTEI() {
    let blob = new Blob([data.generateTEI()], { type: "octet/stream" });

    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "file.tei";
    a.display = "none";

    document.body.append(a);

    a.click();
  }

  function downloadTEIPublisherApp() {
    // TODO
  }

  function showEmbeddedCode() {
    // TODO
  }

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Finalize your digital edition
      </Typography>

      <p>
        You can download the file in TEI/XML or also in RDF/XML. Both formats provide structured data, but TEI/XML focuses on textual encoding for research, while RDF/XML emphasizes metadata and relationships. Choose the format that best suits your needs for data analysis or digital humanities projects.
      </p>
      <Button variant="contained" onClick={downloadTEI}>
        TEI/XML DiSCePT file
      </Button>

      <p>
        You can also choose to publish your digital scholarly edition using the TEI Publisher tool. This tool offers a user-friendly interface for displaying and managing TEI-encoded texts, ensuring that your edition is accessible and well-presented. It simplifies the process, making digital publication more efficient and widely available.
      </p>
      <Button variant="contained" onClick={downloadTEIPublisherApp}>
        TEI-Publisher app
      </Button>

      <p>
        Transforming your file solely into HTML is another option. HTML ensures your content is web-friendly and easily accessible through any browser. This format is ideal for creating interactive and visually appealing digital editions. It allows for seamless integration of multimedia elements, enhancing user experience and engagement with your scholarly work.
      </p>
      <Button variant="contained" onClick={showEmbeddedCode}>
        HTML embedded code
      </Button>
    </Box>
  );
}

const FinalOnboarding = [
  {
    popover: {
      title: "Final section",
      description: "TODO",
    },
  },
];

export { FinalView, FinalOnboarding };
