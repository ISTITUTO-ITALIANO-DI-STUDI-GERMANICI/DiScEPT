// Import necessary modules
import * as React from "react";
import data from "../Data.js";

// PreventClosing Component - Adds a browser unload event listener that warns users if they try to close or reload the page when unsaved data changes are detected.
export default function PreventClosing() {
  // Set up a warning to prevent the page from closing if data changes are unsaved
  window.onbeforeunload = () => data.isChanged; // Returns `true` if there are unsaved changes, triggering the browser's unload confirmation dialog.

  // Render an empty fragment as this component only needs to handle the unload event
  return <></>;
}
