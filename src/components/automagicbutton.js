// Import necessary modules and components
import * as React from "react";
import Button from "@mui/material/Button"; // Material-UI button component
import CircularProgress from "@mui/material/CircularProgress"; // Loading spinner component

import data from "../Data.js"; // Custom module to retrieve language-specific documents
import CETEIHelper from "../CETEIHelper.js"; // Helper for transforming TEI XML to HTML5

// URL for backend API that performs text alignment
const MAGIC_URL = process.env.REACT_APP_ALIGNMENT_URL || "http://localhost:8000/align/tei";

// AutomagicButton Component - Button to initiate alignment process between two languages
export default function AutomagicButton({ languageA, languageB, onAlignmentComplete, ...props }) {
  // State to manage loading indicator during API request
  const [loading, setLoading] = React.useState(false);

  // Handles the button click, retrieves data, processes it, and makes an API request
  const click = async () => {
    setLoading(true); // Set loading state to true to show loading spinner

    try {
      // Prepare payload with full TEI XML documents
      const payload = {
        source_tei: data.getDocumentPerLanguage(languageA),
        target_tei: data.getDocumentPerLanguage(languageB),
        source_language: languageA,
        target_language: languageB
      };

      // Perform POST request to alignment API
      const response = await fetch(MAGIC_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.aligned_xml) {
        // Parse the aligned XML to extract link information
        const parser = new DOMParser();
        const alignedDoc = parser.parseFromString(result.aligned_xml, "text/xml");
        
        // Extract the individual TEI documents from the teiCorpus
        const teiDocs = alignedDoc.querySelectorAll("teiCorpus > TEI");
        
        // Update our local documents with the backend's aligned versions
        teiDocs.forEach((teiDoc) => {
          const langUsage = teiDoc.querySelector("profileDesc langUsage language");
          if (langUsage) {
            const language = langUsage.getAttribute("ident");
            if (language === languageA || language === languageB) {
              // Update the document in our data structure
              data.updateDocumentPerLanguage(language, teiDoc.outerHTML);
              console.log(`Updated ${language} document with backend-generated IDs`);
            }
          }
        });
        
        // Extract links from standOff section
        const links = alignedDoc.querySelectorAll("standOff linkGrp link");
        
        links.forEach((link) => {
          const targets = link.getAttribute("target");
          const category = link.getAttribute("type") || "Linguistic";
          
          if (targets) {
            // Parse target attribute: "#id1 #id2" -> ["id1", "id2"]
            const ids = targets.split(" ").map(id => id.replace("#", ""));
            
            console.log("Parsed alignment IDs:", ids);
            
            if (ids.length === 2) {
              // Each link contains exactly 2 IDs: source and target
              const sourceIds = [ids[0]];
              const targetIds = [ids[1]];
              
              console.log("Source IDs:", sourceIds, "Target IDs:", targetIds);
              
              // Add alignment to data structure
              data.addAlignment(languageA, languageB, sourceIds, targetIds, category);
            } else {
              console.warn("Unexpected number of IDs in alignment:", ids);
            }
          }
        });

        // Notify parent component that alignment is complete
        if (onAlignmentComplete) {
          onAlignmentComplete(result.alignment_count || links.length);
        }
      }
    } catch (error) {
      console.error("Alignment request failed:", error);
    } finally {
      setLoading(false); // Reset loading state to hide spinner
    }
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
