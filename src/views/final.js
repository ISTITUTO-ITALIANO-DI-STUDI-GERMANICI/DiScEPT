import * as React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import data from '../Data.js';

export default function FinalView() {
  function downloadTEI() {
    let blob = new Blob([data.generateTEI()], {type: "octet/stream"});

    let url = URL.createObjectURL(blob);

    let a = document.createElement('a');
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
      <Typography variant="h3" gutterBottom>Finalize your digital edition</Typography>

      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi sit amet augue justo. Vivamus quis sagittis massa. Fusce molestie id lorem vel vehicula. Donec eu nibh vitae massa feugiat consectetur at non est. Aenean ultricies ipsum ac nisl placerat, vitae vehicula lacus varius. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut sollicitudin pulvinar dictum. Quisque ultricies gravida est. Cras sit amet sodales nisl. Proin iaculis elementum odio, eget rutrum massa feugiat quis. Nam vestibulum vulputate nisl, et ultrices arcu auctor in. Cras hendrerit efficitur ex vitae porta.</p>
      <Button variant="contained" onClick={downloadTEI}>TEI/XML DiSCePT file</Button>

      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi sit amet augue justo. Vivamus quis sagittis massa. Fusce molestie id lorem vel vehicula. Donec eu nibh vitae massa feugiat consectetur at non est. Aenean ultricies ipsum ac nisl placerat, vitae vehicula lacus varius. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut sollicitudin pulvinar dictum. Quisque ultricies gravida est. Cras sit amet sodales nisl. Proin iaculis elementum odio, eget rutrum massa feugiat quis. Nam vestibulum vulputate nisl, et ultrices arcu auctor in. Cras hendrerit efficitur ex vitae porta.</p>
      <Button variant="contained" onClick={downloadTEIPublisherApp}>TEI-Publisher app</Button>

      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi sit amet augue justo. Vivamus quis sagittis massa. Fusce molestie id lorem vel vehicula. Donec eu nibh vitae massa feugiat consectetur at non est. Aenean ultricies ipsum ac nisl placerat, vitae vehicula lacus varius. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut sollicitudin pulvinar dictum. Quisque ultricies gravida est. Cras sit amet sodales nisl. Proin iaculis elementum odio, eget rutrum massa feugiat quis. Nam vestibulum vulputate nisl, et ultrices arcu auctor in. Cras hendrerit efficitur ex vitae porta.</p>
      <Button variant="contained" onClick={showEmbeddedCode}>HTML embedded code</Button>

    </Box>
  );
}
