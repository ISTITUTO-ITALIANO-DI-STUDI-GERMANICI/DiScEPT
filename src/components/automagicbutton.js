// Import necessary modules and components
import * as React from "react";
import Button from "@mui/material/Button"; // Material-UI button component
import CircularProgress from "@mui/material/CircularProgress"; // Loading spinner component

import data from "../Data.js"; // Custom module to retrieve language-specific documents
import CETEIHelper from "../CETEIHelper.js"; // Helper for transforming TEI XML to HTML5

// URL for backend API that performs text alignment
const MAGIC_URL = "http://localhost:5000/align";

// AutomagicButton Component - Button to initiate alignment process between two languages
export default function AutomagicButton({ languageA, languageB, ...props }) {
  // State to manage loading indicator during API request
  const [loading, setLoading] = React.useState(false);

  // Handles the button click, retrieves data, processes it, and makes an API request
  const click = async () => {
    const obj = { a: null, b: null }; // Object to store transformed language data for alignment

    // Retrieve and transform document for languageA using CETEIHelper
    const a = CETEIHelper.CETEI.makeHTML5(
      data.getDocumentPerLanguage(languageA), // Retrieve document based on languageA
      null,
      (domElm, teiElm) => (obj.a = { domElm, teiElm }), // Callback to store relevant elements in obj
    )
      .getElementsByTagName("tei-body")[0] // Get main content body of the document
      .textContent.trim(); // Extract and trim text content

    // Retrieve and transform document for languageB similarly
    const b = CETEIHelper.CETEI.makeHTML5(
      data.getDocumentPerLanguage(languageB), // Retrieve document based on languageB
      null,
      (domElm, teiElm) => (obj.b = { domElm, teiElm }), // Callback to store relevant elements in obj
    )
      .getElementsByTagName("tei-body")[0] // Get main content body of the document
      .textContent.trim(); // Extract and trim text content

    setLoading(true); // Set loading state to true to show loading spinner

    // Perform POST request to alignment API
    const response = await fetch(MAGIC_URL, {
      method: "POST",
      headers: {
        Accept: "application/json", // Specify JSON response format
        "Content-Type": "application/json", // Specify JSON request format
      },
      body: JSON.stringify({ a, b }), // Send language data as request body
    }).then(
      (r) => r.json(), // Parse response JSON
      () => setLoading(false), // Reset loading on error
    );

    if (!response) return; // If no response, exit function

    // Process alignment response
    for (const align of response) {
      console.log(align); // Log each alignment result to the console (for debugging/verification)
    }

    setLoading(false); // Reset loading state to hide spinner
  };

  // Content component - displays either a spinner or text based on loading state
  const Content = ({ loading }) => {
    if (loading) return <CircularProgress size="24px" />; // Show spinner if loading
    return <div>Auto Alignment (AI)</div>; // Default button text
  };

  return (
    <Button
      variant="contained"
      disabled={loading || languageA === "" || languageB === ""}
      onClick={click}
      {...props}
    >
      <Content loading={loading} />
    </Button>
  );
}
