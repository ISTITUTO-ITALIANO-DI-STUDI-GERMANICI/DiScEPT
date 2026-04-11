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
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import data from "../Data.js";
import AboutAIDialog from "./aboutaidialog.js";

const AI_MODELS = [
  {
    id: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    short: "MiniLM L12",
    label: "MiniLM L12",
    size: "~120 MB",
    languages: "50 languages",
    prefix: null,
  },
  {
    id: "Xenova/multilingual-e5-small",
    short: "E5 small",
    label: "E5 small",
    size: "~120 MB",
    languages: "100 languages",
    prefix: "passage: ",
  },
  {
    id: "Xenova/multilingual-e5-base",
    short: "E5 base",
    label: "E5 base",
    size: "~280 MB",
    languages: "100 languages",
    prefix: "passage: ",
  },
];

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
 * Downloads model on-demand and caches it in the browser.
 */
export default function SmartAlignButton({ languageA, languageB, onAlignmentUpdated, disabled, ...props }) {
  const [loading, setLoading] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);
  const [phase, setPhase] = React.useState("idle"); // idle | loading | computing | aligning | done
  const [embedProgress, setEmbedProgress] = React.useState({ done: 0, total: 0 });
  const [selectedModelId, setSelectedModelId] = React.useState(AI_MODELS[0].id);
  const [aboutOpen, setAboutOpen] = React.useState(false);
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
   * Align two sets of sentences using dynamic programming to find
   * the optimal order-preserving (monotone) alignment.
   *
   * This is a Needleman-Wunsch-style DP: it maximises the total cosine
   * similarity while guaranteeing that if A[i] aligns to B[j] and A[i']
   * aligns to B[j'] with i' > i, then j' > j.
   *
   * Complexity: O(n * m) time and space — fine for ~200 × 200 elements.
   */
  const alignSentences = (embeddingsA, embeddingsB, threshold = 0.2) => {
    const n = embeddingsA.length;
    const m = embeddingsB.length;

    // Precompute full similarity matrix
    const sim = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) =>
        cosineSimilarity(embeddingsA[i].data, embeddingsB[j].data)
      )
    );

    // dp[i][j] = best cumulative score aligning A[0..i-1] with B[0..j-1]
    // Gap penalty = 0: skipping costs nothing but gains nothing either.
    // A bad match (negative cosine) will therefore be skipped automatically.
    const dp = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
    // 0: match, 1: skipA, 2: skipB
    const parent = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const matchScore = dp[i - 1][j - 1] + sim[i - 1][j - 1];
        const skipA     = dp[i - 1][j];
        const skipB     = dp[i][j - 1];

        if (matchScore >= skipA && matchScore >= skipB) {
          dp[i][j] = matchScore;
          parent[i][j] = 0; // match
        } else if (skipA >= skipB) {
          dp[i][j] = skipA;
          parent[i][j] = 1; // skipA
        } else {
          dp[i][j] = skipB;
          parent[i][j] = 2; // skipB
        }
      }
    }

    // Traceback
    const alignments = [];
    let i = n, j = m;
    while (i > 0 && j > 0) {
      switch (parent[i][j]) {
        case 0: // match
          if (sim[i - 1][j - 1] >= threshold) {
            alignments.unshift({ sourceIdx: i - 1, targetIdx: j - 1, score: sim[i - 1][j - 1] });
          }
          i--; j--;
          break;
        case 1: // skipA
          i--;
          break;
        default: // skipB
          j--;
      }
    }

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
    setPhase("loading");
    setEmbedProgress({ done: 0, total: 0 });

    try {
      const { pipeline, env } = await loadTransformers();
      const selectedModel = AI_MODELS.find(m => m.id === selectedModelId) ?? AI_MODELS[0];

      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.backends.onnx.wasm.proxy = true;

      const extractor = await pipeline(
        "feature-extraction",
        selectedModel.id,
        { progress_callback: () => {} }
      );

      // Extract text elements from both documents
      const xmlA = data.getDocumentPerLanguage(languageA);
      const xmlB = data.getDocumentPerLanguage(languageB);

      let elementsA = extractTextElements(xmlA);
      let elementsB = extractTextElements(xmlB);

      if (elementsA.length === 0 || elementsB.length === 0) {
        throw new Error("One or both documents have no text elements to align");
      }

      elementsA = ensureIds(xmlA, languageA, elementsA);
      elementsB = ensureIds(xmlB, languageB, elementsB);

      const total = elementsA.length + elementsB.length;
      setPhase("computing");
      setEmbedProgress({ done: 0, total });

      // Compute embeddings in small batches, yielding between each so the
      // browser can repaint and the progress counter stays responsive.
      const BATCH_SIZE = 8;
      const computeEmbeddings = async (texts, offset) => {
        const results = [];
        for (let i = 0; i < texts.length; i += BATCH_SIZE) {
          const batch = texts.slice(i, i + BATCH_SIZE);
          const output = await extractor(batch, { pooling: "mean", normalize: true });
          const dim = output.dims[1];
          for (let j = 0; j < batch.length; j++) {
            results.push({ data: Array.from(output.data.slice(j * dim, (j + 1) * dim)) });
          }
          setEmbedProgress({ done: offset + i + batch.length, total });
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        return results;
      };

      const prefix = selectedModel.prefix ?? "";
      const textsA = elementsA.map(e => prefix + e.text);
      const textsB = elementsB.map(e => prefix + e.text);

      const embArrayA = await computeEmbeddings(textsA, 0);
      const embArrayB = await computeEmbeddings(textsB, textsA.length);

      setPhase("aligning");
      await new Promise(resolve => setTimeout(resolve, 0));

      const alignments = alignSentences(embArrayA, embArrayB);

      alignments.forEach(alignment => {
        const sourceId = elementsA[alignment.sourceIdx].id;
        const targetId = elementsB[alignment.targetIdx].id;
        if (sourceId && targetId) {
          data.addAlignment(languageA, languageB, [sourceId], [targetId], "Semantic");
        }
      });

      setPhase("done");

      if (onAlignmentUpdated) {
        onAlignmentUpdated([languageA, languageB]);
      }

      showMessage(
        `Smart alignment complete! Created ${alignments.length} alignment${alignments.length !== 1 ? "s" : ""}.`,
        "success"
      );

    } catch (error) {
      console.error("Smart alignment error:", error);
      showMessage(`Alignment failed: ${error.message}.`, "error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setDownloadDialog(false);
        setPhase("idle");
        setEmbedProgress({ done: 0, total: 0 });
      }, 1500);
    }
  };

  const selectedModel = AI_MODELS.find(m => m.id === selectedModelId) ?? AI_MODELS[0];

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <FormControl fullWidth size="small" disabled={disabled || loading}>
        <InputLabel id="ai-model-label">AI Model</InputLabel>
        <Select
          labelId="ai-model-label"
          value={selectedModelId}
          label="Modello AI"
          onChange={(e) => setSelectedModelId(e.target.value)}
        >
          {AI_MODELS.map(m => (
            <MenuItem key={m.id} value={m.id}>
              <Box>
                <Typography variant="body2">{m.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {m.size} · {m.languages}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
        <Tooltip title="About AI models">
          <IconButton size="small" onClick={() => setAboutOpen(true)}>
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Button
        variant="contained"
        disabled={disabled || loading || languageA === "" || languageB === ""}
        onClick={performAlignment}
        {...props}
      >
        {loading ? <CircularProgress size="24px" /> : `Smart Align (AI, ${selectedModel.size})`}
      </Button>

      <Dialog open={downloadDialog} disableEscapeKeyDown>
        <DialogTitle>Smart Alignment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {phase === "loading" && `Loading model ${selectedModel.short} (${selectedModel.size})…`}
            {phase === "computing" && `Computing embeddings: ${embedProgress.done} / ${embedProgress.total} texts`}
            {phase === "aligning" && "Finding best alignments…"}
            {phase === "done" && "Complete!"}
          </DialogContentText>
          <Box sx={{ width: "100%" }}>
            {phase === "loading" && <LinearProgress variant="indeterminate" />}
            {phase === "computing" && (
              <>
                <LinearProgress
                  variant="determinate"
                  value={embedProgress.total > 0 ? (embedProgress.done / embedProgress.total) * 100 : 0}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  {embedProgress.total > 0 ? Math.round((embedProgress.done / embedProgress.total) * 100) : 0}%
                </Typography>
              </>
            )}
            {(phase === "aligning" || phase === "done") && (
              <LinearProgress variant={phase === "aligning" ? "indeterminate" : "determinate"} value={100} />
            )}
          </Box>
        </DialogContent>
        {phase === "done" && (
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

      <AboutAIDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
