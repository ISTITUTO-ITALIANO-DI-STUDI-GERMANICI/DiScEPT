import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import data from "../Data.js";

// Lazy load transformers to avoid bundling it by default
let transformersModule = null;
const loadTransformers = async () => {
  if (!transformersModule) {
    transformersModule = await import("@xenova/transformers");
  }
  return transformersModule;
};

/**
 * SmartAlignButton Component
 *
 * Performs client-side alignment using a multilingual sentence embedding model.
 * Downloads model on-demand (~120 MB) and caches it in the browser.
 *
 * Model: paraphrase-multilingual-MiniLM-L12-v2
 * Languages: 50+ including IT, DE, EN, FR, ES, etc.
 */
export default function SmartAlignButton({ languageA, languageB, onAlignmentUpdated, disabled, ...props }) {
  const [loading, setLoading] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showMessage = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  /**
   * Extract text elements from TEI document
   */
  const extractTextElements = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Invalid XML");
    }

    // Extract text-bearing elements (p, l, ab, head, etc.)
    const elements = [];
    const selectors = ["p", "l", "ab", "head", "quote", "note", "stage", "sp"];

    selectors.forEach(selector => {
      const nodes = xmlDoc.querySelectorAll(`text ${selector}`);
      nodes.forEach(node => {
        const id = node.getAttribute("xml:id");
        const text = node.textContent.trim();

        if (text) {
          elements.push({
            id: id || null,
            text: text,
            element: node,
            tag: selector
          });
        }
      });
    });

    return elements;
  };

  /**
   * Calculate cosine similarity between two vectors
   */
  const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  /**
   * Align two sets of sentences using embeddings
   */
  const alignSentences = (embeddingsA, embeddingsB) => {
    const alignments = [];
    const usedB = new Set();

    // For each sentence in A, find best match in B
    embeddingsA.forEach((embA, idxA) => {
      let bestScore = -1;
      let bestIdx = -1;

      embeddingsB.forEach((embB, idxB) => {
        if (usedB.has(idxB)) return;

        const similarity = cosineSimilarity(embA.data, embB.data);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestIdx = idxB;
        }
      });

      // Only create alignment if similarity is above threshold
      if (bestScore > 0.5 && bestIdx !== -1) {
        alignments.push({
          sourceIdx: idxA,
          targetIdx: bestIdx,
          score: bestScore
        });
        usedB.add(bestIdx);
      }
    });

    return alignments;
  };

  /**
   * Ensure elements have xml:id attributes
   */
  const ensureIds = (xmlString, language, elements) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    let modified = false;

    elements.forEach((elem, idx) => {
      if (!elem.id) {
        // Find the element in the DOM and add ID
        const selector = elem.tag;
        const nodes = Array.from(xmlDoc.querySelectorAll(`text ${selector}`));

        // Match by text content
        const node = nodes.find(n => n.textContent.trim() === elem.text);
        if (node) {
          const newId = `${language}-${selector}-${idx}-${Date.now()}`;
          node.setAttribute("xml:id", newId);
          elem.id = newId;
          modified = true;
        }
      }
    });

    if (modified) {
      const serializer = new XMLSerializer();
      const updatedXml = serializer.serializeToString(xmlDoc);
      data.updateDocumentPerLanguage(language, updatedXml);
    }

    return elements;
  };

  /**
   * Main alignment function
   */
  const performAlignment = async () => {
    setLoading(true);
    setDownloadDialog(true);

    try {
      // Load transformers library
      setDownloadProgress(10);
      const { pipeline, env } = await loadTransformers();

      // Configure cache and progress
      env.allowLocalModels = false;
      env.allowRemoteModels = true;

      setDownloadProgress(20);
      showMessage("Loading AI model... This may take 30-60 seconds on first use.", "info");

      // Track progress per file
      const fileProgress = {};

      // Use ONNX proxy worker to avoid blocking the main thread
      env.backends.onnx.wasm.proxy = true;

      // Load the model with progress tracking
      const extractor = await pipeline(
        "feature-extraction",
        "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
        {
          progress_callback: (progress) => {
            if (progress.status === "progress" && progress.file) {
              // Track progress for each file separately
              fileProgress[progress.file] = progress.progress || 0;

              // Calculate average progress across all files
              const files = Object.keys(fileProgress);
              const avgProgress = files.reduce((sum, file) => sum + fileProgress[file], 0) / files.length;

              // Map to 20-70% range
              const percent = Math.min(20 + (avgProgress * 50), 70);
              setDownloadProgress(percent);
            } else if (progress.status === "done") {
              setDownloadProgress(70);
            }
          }
        }
      );

      setDownloadProgress(70);
      showMessage("Model loaded! Extracting text elements...", "info");

      // Extract text elements from both documents
      const xmlA = data.getDocumentPerLanguage(languageA);
      const xmlB = data.getDocumentPerLanguage(languageB);

      let elementsA = extractTextElements(xmlA);
      let elementsB = extractTextElements(xmlB);

      if (elementsA.length === 0 || elementsB.length === 0) {
        throw new Error("One or both documents have no text elements to align");
      }

      setDownloadProgress(75);
      showMessage(`Found ${elementsA.length} elements in ${languageA} and ${elementsB.length} in ${languageB}`, "info");

      // Ensure all elements have IDs
      elementsA = ensureIds(xmlA, languageA, elementsA);
      elementsB = ensureIds(xmlB, languageB, elementsB);

      showMessage("Computing sentence embeddings...", "info");

      // Compute embeddings in small batches, yielding between each batch
      // so the browser stays responsive and progress updates are visible.
      const BATCH_SIZE = 8;
      const computeEmbeddings = async (texts, progressStart, progressEnd) => {
        const results = [];
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
          const batch = texts.slice(i, i + BATCH_SIZE);
          const output = await extractor(batch, { pooling: "mean", normalize: true });
          const dim = output.dims[1];
          for (let j = 0; j < batch.length; j++) {
            results.push({ data: Array.from(output.data.slice(j * dim, (j + 1) * dim)) });
          }
          const pct = progressStart + ((i + batch.length) / texts.length) * (progressEnd - progressStart);
          setDownloadProgress(Math.round(pct));
          // Yield to the event loop so the browser can repaint
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        return results;
      };

      const textsA = elementsA.map(e => e.text);
      const textsB = elementsB.map(e => e.text);

      const embArrayA = await computeEmbeddings(textsA, 75, 87);
      const embArrayB = await computeEmbeddings(textsB, 87, 95);

      showMessage("Finding best alignments...", "info");

      // Perform alignment
      const alignments = alignSentences(embArrayA, embArrayB);

      setDownloadProgress(95);

      // Create alignments in data structure
      alignments.forEach(alignment => {
        const sourceId = elementsA[alignment.sourceIdx].id;
        const targetId = elementsB[alignment.targetIdx].id;

        if (sourceId && targetId) {
          data.addAlignment(
            languageA,
            languageB,
            [sourceId],
            [targetId],
            "Semantic" // Use semantic category for AI alignments
          );
        }
      });

      setDownloadProgress(100);

      // Notify parent
      if (onAlignmentUpdated) {
        onAlignmentUpdated([languageA, languageB]);
      }

      showMessage(
        `Smart alignment complete! Created ${alignments.length} alignment${alignments.length !== 1 ? "s" : ""}.`,
        "success"
      );

    } catch (error) {
      console.error("Smart alignment error:", error);
      showMessage(
        `Alignment failed: ${error.message}. Please check your documents and try again.`,
        "error"
      );
    } finally {
      setLoading(false);
      setTimeout(() => {
        setDownloadDialog(false);
        setDownloadProgress(0);
      }, 1500);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        disabled={disabled || loading || languageA === "" || languageB === ""}
        onClick={performAlignment}
        {...props}
      >
        {loading ? <CircularProgress size="24px" /> : "Smart Align (AI, 120MB)"}
      </Button>

      <Dialog open={downloadDialog} disableEscapeKeyDown>
        <DialogTitle>Smart Alignment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {downloadProgress < 70
              ? "Downloading AI model (first use only, ~120 MB)..."
              : downloadProgress < 100
              ? "Processing alignment..."
              : "Complete!"}
          </DialogContentText>
          <Box sx={{ width: "100%" }}>
            <LinearProgress variant="determinate" value={downloadProgress} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              {Math.round(downloadProgress)}%
            </Typography>
          </Box>
        </DialogContent>
        {downloadProgress === 100 && (
          <DialogActions>
            <Button onClick={() => setDownloadDialog(false)}>Close</Button>
          </DialogActions>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            ...(snackbar.severity === "success" && {
              backgroundColor: "#5E9278",
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
