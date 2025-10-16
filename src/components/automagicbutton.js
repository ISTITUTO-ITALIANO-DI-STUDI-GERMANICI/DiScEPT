// Import necessary modules and components
import * as React from "react";
import Button from "@mui/material/Button"; // Material-UI button component
import CircularProgress from "@mui/material/CircularProgress"; // Loading spinner component
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import data from "../Data.js"; // Custom module to retrieve language-specific documents

// URL for backend API that performs text alignment
const MAGIC_URL =
  process.env.REACT_APP_ALIGNMENT_URL || "https://bertalign-api-fpsfeeskyq-uc.a.run.app/align/tei";

// AutomagicButton Component - Button to initiate alignment process between two languages
export default function AutomagicButton({ languageA, languageB, onAlignmentUpdated, ...props }) {
  // State to manage loading indicator during API request
  const [loading, setLoading] = React.useState(false);

  // State to manage error/success messages
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "error", // 'error' | 'warning' | 'info' | 'success'
  });

  // Helper to show messages to user
  const showMessage = (message, severity = "error") => {
    setSnackbar({ open: true, message, severity });
  };

  // Helper to close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Map document_type from backend to our language names
  const getDocumentName = (documentType) => {
    if (documentType === "source") return languageA;
    if (documentType === "target") return languageB;
    return documentType;
  };

  // Handle structured error responses from the backend
  const handleAPIError = (errorData, statusCode) => {
    console.error("API Error:", errorData);

    // Check if it's a structured error with error_code
    if (errorData.error_code) {
      handleStructuredError(errorData);
    }
    // Check if it's a Pydantic validation error
    else if (errorData.detail && Array.isArray(errorData.detail)) {
      handleValidationError(errorData);
    }
    // Fallback for unknown error format
    else {
      const message = errorData.error || errorData.detail || "An unexpected error occurred";
      showMessage(`Error (${statusCode}): ${message}`, "error");
    }
  };

  // Handle structured errors based on error code
  const handleStructuredError = (error) => {
    const code = error.error_code;

    // Route to specific handler based on error code prefix
    if (code.startsWith("TEI_10")) {
      handleXMLParsingError(error);
    } else if (code.startsWith("TEI_11")) {
      handleContentError(error);
    } else if (code.startsWith("ALIGN_")) {
      handleAlignmentError(error);
    } else {
      // Generic error display
      showMessage(`${error.error} (Code: ${error.error_code})`, "error");
    }
  };

  // Handle XML parsing errors (TEI_1000-1099)
  const handleXMLParsingError = (error) => {
    const { document_type, line, column } = error.context || {};
    const docName = getDocumentName(document_type);

    let message = `XML error in ${docName} document`;
    if (line && column) {
      message += ` at line ${line}, column ${column}. Please check your XML formatting.`;
    } else {
      message += `. The XML is not properly formatted.`;
    }

    showMessage(message, "error");
  };

  // Handle TEI content errors (TEI_1100-1199)
  const handleContentError = (error) => {
    const { document_type, missing_element } = error.context || {};
    const docName = getDocumentName(document_type);

    const messages = {
      TEI_1100: `${docName} document is missing a <${missing_element}> element. TEI documents must have a <body> element inside <text>.`,
      TEI_1101: `${docName} document has no text to align. Add paragraphs (<p>), headers (<head>), or line elements (<l>).`,
      TEI_1102: `${docName} document is empty. Please add text content to align.`,
    };

    const message = messages[error.error_code] || error.error;
    showMessage(message, "warning");
  };

  // Handle alignment errors (ALIGN_1200-1299)
  const handleAlignmentError = (error) => {
    const { source_sentences, target_sentences } = error.context || {};

    // Check if one document is empty
    if (source_sentences === 0 || target_sentences === 0) {
      const emptyDoc = source_sentences === 0 ? languageA : languageB;
      showMessage(
        `${emptyDoc} document appears to be empty. Both documents must contain text to be aligned.`,
        "error"
      );
      return;
    }

    // Both have content but alignment failed
    showMessage(
      `Alignment failed: ${error.error}. Make sure both documents are parallel texts in the specified languages.`,
      "error"
    );
  };

  // Handle validation errors (VAL_1300-1399)
  const handleValidationError = (errorData) => {
    if (errorData.detail && Array.isArray(errorData.detail)) {
      const errors = errorData.detail.map((err) => {
        const field = err.loc[err.loc.length - 1];
        return `${field}: ${err.msg}`;
      });
      showMessage(`Validation error: ${errors.join(", ")}`, "error");
    }
  };

  // Handles the button click, retrieves data, processes it, and makes an API request
  const click = async () => {
    setLoading(true); // Set loading state to true to show loading spinner

    try {
      // Prepare payload with full TEI XML documents
      const payload = {
        languageA: data.getDocumentPerLanguage(languageA),
        languageB: data.getDocumentPerLanguage(languageB),
        languageA_name: languageA,
        languageB_name: languageB,
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

      // TODO: authorization header when available

      if (!response.ok) {
        try {
          const errorData = await response.json();
          handleAPIError(errorData, response.status);
        } catch (parseError) {
          // Response body is not valid JSON
          showMessage(
            `Server error (${response.status}): ${response.statusText}`,
            "error"
          );
        }
        return;
      }

      const result = await response.json();

      if (!result.aligned_xml) {
        showMessage(
          "Server returned an empty response. No alignment data received.",
          "error"
        );
        return;
      }

      // Parse the aligned XML to extract link information
      const parser = new DOMParser();
      const alignedDoc = parser.parseFromString(result.aligned_xml, "text/xml");
      // Check for parser errors - DOMParser doesn't throw exceptions but creates parsererror elements
      const parseError = alignedDoc.querySelector("parsererror");
      if (parseError) {
        throw new Error(`XML parsing failed: ${parseError.textContent}`);
      }
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
          }
        }
      });

      // Extract join elements that group segments together
      const joins = {};
      alignedDoc.querySelectorAll("standOff join").forEach((join) => {
        const joinId = join.getAttribute("xml:id");
        const targets = join.getAttribute("target");
        if (joinId && targets) {
          // Parse targets and remove # prefix
          joins[joinId] = targets.split(" ").map((id) => id.replace("#", ""));
        }
      });

      // Extract links from standOff section
      const links = alignedDoc.querySelectorAll("standOff linkGrp link");

      links.forEach((link, index) => {
        const targets = link.getAttribute("target");
        const category = link.getAttribute("type") || data.ALIGNMENT_CATEGORIES[0]; // Default to first category if not specified

        if (targets) {
          // Parse target attribute: "#id1 #id2" or "#joinId #id2" -> ["id1", "id2"] or ["joinId", "id2"]
          const targetRefs = targets.split(" ").map((id) => id.replace("#", ""));

          if (targetRefs.length === 2) {
            // Resolve joins to actual segment IDs
            const sourceIds = joins[targetRefs[0]] || [targetRefs[0]];
            const targetIds = joins[targetRefs[1]] || [targetRefs[1]];

            // Add alignment to data structure
            data.addAlignment(languageA, languageB, sourceIds, targetIds, category);
          } else {
            console.warn("Unexpected number of IDs in alignment:", targetRefs);
          }
        }
      });

      // Notify parent about updated alignment documents
      if (onAlignmentUpdated) {
        onAlignmentUpdated([languageA, languageB]);
      }

      // Show success message
      const linkCount = links.length;
      showMessage(
        `Alignment successful! ${linkCount} alignment${linkCount !== 1 ? "s" : ""} created.`,
        "success"
      );
    } catch (error) {
      // Network error or other exception
      console.error("Alignment request failed:", error);
      showMessage(
        "Network error: Could not connect to the alignment service. Please check your internet connection.",
        "error"
      );
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
    <>
      <Button
        variant="contained"
        disabled={loading || languageA === "" || languageB === ""}
        onClick={click}
        {...props}
      >
        <Content loading={loading} />
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            // Use sage green (primary color) for success messages to match button
            ...(snackbar.severity === "success" && {
              backgroundColor: "#5E9278", // Same as button (Verde salvia)
              color: "#FFFFFF",
            }),
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
