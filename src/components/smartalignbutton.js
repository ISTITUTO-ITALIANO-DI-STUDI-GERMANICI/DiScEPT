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
  {
    id: "Xenova/LaBSE",
    short: "LaBSE",
    label: "LaBSE",
    size: "~500 MB",
    languages: "109 languages",
    prefix: null,
  },
];

// Word-level alignment models. Unlike the sentence models above, these are MLMs
// read at an intermediate layer (awesome-align = mBERT truncated to layer 8),
// which give reliable word-to-word correspondence. Loaded lazily, only when a
// verse pair actually has <w> tokens.
const WORD_MODELS = [
  {
    id: "bakulf/awesome-align-tjs",
    short: "awesome-align",
    label: "awesome-align (mBERT L8)",
    size: "~143 MB",
    languages: "104 languages",
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

// Session-level embedding cache: modelId -> Map<text, Float32Array>
const embeddingCache = new Map();

// Minimum cosine similarity for a word-level (Literal) link to be kept.
// Word alignment is precision-oriented: below this, a word is left unaligned
// rather than forced onto a weak match.
const WORD_ALIGN_THRESHOLD = 0.4;

/**
 * SmartAlignButton Component
 *
 * Performs client-side alignment using a multilingual sentence embedding model.
 * Downloads model on-demand and caches it in the browser.
 */
export default function SmartAlignButton({
  languageA,
  languageB,
  onAlignmentUpdated,
  disabled,
  ...props
}) {
  const [loading, setLoading] = React.useState(false);
  const [downloadDialog, setDownloadDialog] = React.useState(false);
  const [phase, setPhase] = React.useState("idle"); // idle | loading | computing | aligning | done
  const [embedProgress, setEmbedProgress] = React.useState({
    done: 0,
    total: 0,
  });
  const [selectedModelId, setSelectedModelId] = React.useState(AI_MODELS[0].id);
  const [selectedWordModelId, setSelectedWordModelId] = React.useState(
    WORD_MODELS[0].id,
  );
  const cancelledRef = React.useRef(false);
  const [cancelling, setCancelling] = React.useState(false);
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
   * Extract text-bearing elements (p, l, ab, head, …) from an already-parsed
   * TEI document. The returned `element` nodes are live references into
   * `xmlDoc`, so mutating them (e.g. adding xml:id) and re-serialising the
   * same document persists the change.
   */
  const extractTextElements = (xmlDoc) => {
    const elements = [];
    const selectors = ["p", "l", "ab", "head", "quote", "note", "stage", "sp"];

    selectors.forEach((selector) => {
      const nodes = xmlDoc.querySelectorAll(`text ${selector}`);
      nodes.forEach((node) => {
        const text = node.textContent.trim();

        if (text) {
          elements.push({
            id: node.getAttribute("xml:id") || null,
            text: text,
            element: node,
            tag: selector,
          });
        }
      });
    });

    return elements;
  };

  /**
   * Return the <w> token elements of a line, in document order, skipping empty
   * ones. Empty array means the line is not tokenised at word level.
   */
  const getWordElements = (lineNode) =>
    Array.from(lineNode.querySelectorAll("w"))
      .map((node) => ({ node, text: node.textContent.trim() }))
      .filter((w) => w.text);

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

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
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
        cosineSimilarity(embeddingsA[i].data, embeddingsB[j].data),
      ),
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
        const skipA = dp[i - 1][j];
        const skipB = dp[i][j - 1];

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
    let i = n,
      j = m;
    while (i > 0 && j > 0) {
      switch (parent[i][j]) {
        case 0: // match
          if (sim[i - 1][j - 1] >= threshold) {
            alignments.unshift({
              sourceIdx: i - 1,
              targetIdx: j - 1,
              score: sim[i - 1][j - 1],
            });
          }
          i--;
          j--;
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
   * Ensure an element has an xml:id, generating a stable one if missing.
   * Mutates the node in place and returns the id. `changed` is a single-element
   * boolean box so callers can track whether the owning document needs saving.
   */
  const ensureNodeId = (node, fallbackId, changed) => {
    let id = node.getAttribute("xml:id");
    if (!id) {
      id = fallbackId;
      node.setAttribute("xml:id", id);
      changed.value = true;
    }
    return id;
  };

  /**
   * Align the words of two already-tokenised lines.
   *
   * Uses contextual token embeddings (mean-pooled per <w> over its sub-word
   * pieces) and a bidirectional argmax: a pair (i, j) is kept only if j is the
   * best match for i *and* i is the best match for j, and the cosine clears
   * WORD_ALIGN_THRESHOLD.
   *
   * NOTE: with the current sentence-embedding models this is not reliable —
   * a content word can be dragged onto a phrase-head that absorbed the same
   * meaning in context (e.g. "cammin" → "MIDWAY upon the journey of our life",
   * where "MIDWAY" outscores the correct "journey"). Fixing this needs a
   * word-alignment-grade representation, not a matching tweak.
   *
   * Returns [{ i, j, score }] index pairs into wordsA / wordsB.
   */
  const alignWords = (vecsA, vecsB, threshold = WORD_ALIGN_THRESHOLD) => {
    const n = vecsA.length;
    const m = vecsB.length;
    if (n === 0 || m === 0) return [];

    const sim = Array.from({ length: n }, (_, i) =>
      Array.from({ length: m }, (_, j) => cosineSimilarity(vecsA[i], vecsB[j])),
    );

    const bestB = sim.map((row) => {
      let bj = 0,
        bv = -Infinity;
      for (let j = 0; j < row.length; j++)
        if (row[j] > bv) {
          bv = row[j];
          bj = j;
        }
      return bj;
    });
    const bestA = Array.from({ length: m }, (_, j) => {
      let bi = 0,
        bv = -Infinity;
      for (let i = 0; i < n; i++)
        if (sim[i][j] > bv) {
          bv = sim[i][j];
          bi = i;
        }
      return bi;
    });

    const pairs = [];
    for (let i = 0; i < n; i++) {
      const j = bestB[i];
      if (bestA[j] === i && sim[i][j] >= threshold) {
        pairs.push({ i, j, score: sim[i][j] });
      }
    }
    return pairs;
  };

  /**
   * Main alignment function
   */
  const performAlignment = async () => {
    cancelledRef.current = false;
    setCancelling(false);
    setLoading(true);
    setDownloadDialog(true);
    setPhase("loading");
    setEmbedProgress({ done: 0, total: 0 });

    try {
      const { pipeline, env, Tensor } = await loadTransformers();
      const selectedModel =
        AI_MODELS.find((m) => m.id === selectedModelId) ?? AI_MODELS[0];
      const selectedWordModel =
        WORD_MODELS.find((m) => m.id === selectedWordModelId) ?? WORD_MODELS[0];

      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.backends.onnx.wasm.proxy = true;

      const extractor = await pipeline("feature-extraction", selectedModel.id, {
        progress_callback: () => {},
      });

      // Parse each document once. The extracted element nodes are live
      // references into these docs, so any xml:id we add here is persisted by
      // re-serialising the same document at the end.
      const parser = new DOMParser();
      const docA = parser.parseFromString(
        data.getDocumentPerLanguage(languageA),
        "application/xml",
      );
      const docB = parser.parseFromString(
        data.getDocumentPerLanguage(languageB),
        "application/xml",
      );
      if (
        docA.querySelector("parsererror") ||
        docB.querySelector("parsererror")
      ) {
        throw new Error("Invalid XML");
      }
      const docAChanged = { value: false };
      const docBChanged = { value: false };

      const elementsA = extractTextElements(docA);
      const elementsB = extractTextElements(docB);

      if (elementsA.length === 0 || elementsB.length === 0) {
        throw new Error("One or both documents have no text elements to align");
      }

      // Word-level embeddings come from a SEPARATE model: an MLM read at an
      // intermediate layer (awesome-align = mBERT truncated to layer 8), which —
      // unlike the sentence model above — gives reliable word-to-word matches.
      // It is loaded lazily (on-demand from HF, ~143 MB) the first time a verse
      // pair actually needs word alignment, so documents without <w> tokens
      // never download it. Per line we run one forward pass and mean-pool the
      // sub-word vectors of each <w> (the SimAlign method).
      let wordExtractor = null;
      let wordSpecials = null;
      const getWordExtractor = async () => {
        if (!wordExtractor) {
          wordExtractor = await pipeline(
            "feature-extraction",
            selectedWordModel.id,
            { progress_callback: () => {} },
          );
          const probe = await wordExtractor.tokenizer("a");
          const ids = Array.from(probe.input_ids.data, Number);
          wordSpecials = { cls: ids[0], sep: ids[ids.length - 1] };
        }
        return wordExtractor;
      };

      const computeWordVectors = async (words) => {
        const we = await getWordExtractor();
        const ids = [wordSpecials.cls];
        const wordOfPos = [-1]; // -1 marks special tokens
        for (let wi = 0; wi < words.length; wi++) {
          const enc = await we.tokenizer(words[wi], {
            add_special_tokens: false,
          });
          for (const piece of enc.input_ids.data) {
            ids.push(Number(piece));
            wordOfPos.push(wi);
          }
        }
        ids.push(wordSpecials.sep);
        wordOfPos.push(-1);

        const seq = ids.length;
        const inputIds = new Tensor(
          "int64",
          BigInt64Array.from(ids, (v) => BigInt(v)),
          [1, seq],
        );
        const attention = new Tensor(
          "int64",
          BigInt64Array.from(ids, () => 1n),
          [1, seq],
        );
        const tokenTypes = new Tensor(
          "int64",
          BigInt64Array.from(ids, () => 0n),
          [1, seq],
        );
        const output = await we.model({
          input_ids: inputIds,
          attention_mask: attention,
          token_type_ids: tokenTypes,
        });
        const hidden = output.last_hidden_state; // layer 8 (model truncated to 8 layers)
        const dim = hidden.dims[2];
        const hData = hidden.data;

        const acc = words.map(() => ({ sum: new Float64Array(dim), n: 0 }));
        for (let p = 0; p < wordOfPos.length; p++) {
          const wi = wordOfPos[p];
          if (wi < 0) continue;
          const off = p * dim;
          for (let d = 0; d < dim; d++) acc[wi].sum[d] += hData[off + d];
          acc[wi].n++;
        }
        return acc.map((v) => {
          const out = new Float32Array(dim);
          let norm = 0;
          for (let d = 0; d < dim; d++) {
            const x = v.n ? v.sum[d] / v.n : 0;
            out[d] = x;
            norm += x * x;
          }
          norm = Math.sqrt(norm) || 1;
          for (let d = 0; d < dim; d++) out[d] /= norm;
          return out;
        });
      };

      const total = elementsA.length + elementsB.length;
      setPhase("computing");
      setEmbedProgress({ done: 0, total });

      // 512 tokens ≈ 1500 characters — pre-truncate so the tokenizer doesn't
      // waste time on text the model would discard anyway.
      const MAX_CHARS = 1500;
      const truncate = (t) =>
        t.length > MAX_CHARS ? t.slice(0, MAX_CHARS) : t;

      // Per-model cache for this session.
      if (!embeddingCache.has(selectedModel.id)) {
        embeddingCache.set(selectedModel.id, new Map());
      }
      const modelCache = embeddingCache.get(selectedModel.id);

      const BATCH_SIZE = 32;
      const computeEmbeddings = async (texts, offset) => {
        const results = new Array(texts.length);

        // Separate cached from uncached
        const uncachedIndices = [];
        for (let i = 0; i < texts.length; i++) {
          const cached = modelCache.get(texts[i]);
          if (cached) {
            results[i] = { data: cached };
          } else {
            uncachedIndices.push(i);
          }
        }

        for (let b = 0; b < uncachedIndices.length; b += BATCH_SIZE) {
          if (cancelledRef.current) throw new Error("cancelled");
          const batchIndices = uncachedIndices.slice(b, b + BATCH_SIZE);
          const batch = batchIndices.map((i) => truncate(texts[i]));
          const output = await extractor(batch, {
            pooling: "mean",
            normalize: true,
          });
          const dim = output.dims[1];
          for (let j = 0; j < batchIndices.length; j++) {
            const embedding = Array.from(
              output.data.slice(j * dim, (j + 1) * dim),
            );
            modelCache.set(texts[batchIndices[j]], embedding);
            results[batchIndices[j]] = { data: embedding };
          }
          setEmbedProgress({
            done:
              offset +
              uncachedIndices[
                Math.min(b + BATCH_SIZE, uncachedIndices.length) - 1
              ] +
              1,
            total,
          });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        // Ensure final count is accurate (all cached = instant)
        setEmbedProgress({ done: offset + texts.length, total });
        return results;
      };

      const prefix = selectedModel.prefix ?? "";
      const textsA = elementsA.map((e) => prefix + e.text);
      const textsB = elementsB.map((e) => prefix + e.text);

      const embArrayA = await computeEmbeddings(textsA, 0);
      const embArrayB = await computeEmbeddings(textsB, textsA.length);

      setPhase("aligning");
      await new Promise((resolve) => setTimeout(resolve, 0));

      const alignments = alignSentences(embArrayA, embArrayB);

      let lineLinks = 0;
      let wordLinks = 0;

      // First pass: create the coarse line-level (Semantic) links and collect
      // the verse pairs that are tokenised at word level on BOTH sides.
      const wordJobs = [];
      for (const alignment of alignments) {
        if (cancelledRef.current) throw new Error("cancelled");

        const elemA = elementsA[alignment.sourceIdx];
        const elemB = elementsB[alignment.targetIdx];

        const lineIdA = ensureNodeId(
          elemA.element,
          `${languageA}-${elemA.tag}-${alignment.sourceIdx}-${Date.now()}`,
          docAChanged,
        );
        const lineIdB = ensureNodeId(
          elemB.element,
          `${languageB}-${elemB.tag}-${alignment.targetIdx}-${Date.now()}`,
          docBChanged,
        );

        // Always record the coarse line-level (Semantic) correspondence.
        data.addAlignment(
          languageA,
          languageB,
          [lineIdA],
          [lineIdB],
          "Semantic",
        );
        lineLinks++;

        // Descend to word level only when BOTH lines are tokenised into <w>.
        // Mismatched levels fall back to the line link above.
        const wordsA = getWordElements(elemA.element);
        const wordsB = getWordElements(elemB.element);
        if (wordsA.length > 0 && wordsB.length > 0) {
          wordJobs.push({ wordsA, wordsB, lineIdA, lineIdB });
        }
      }

      // Second pass: word-level (Literal) links. Only now — if some verse pair
      // has words — do we load the large word model, so documents without <w>
      // tokens never pay for the download.
      if (wordJobs.length > 0) {
        setPhase("loadingWord");
        await getWordExtractor();
        setPhase("aligningWords");
        setEmbedProgress({ done: 0, total: wordJobs.length });

        for (let k = 0; k < wordJobs.length; k++) {
          if (cancelledRef.current) throw new Error("cancelled");
          const { wordsA, wordsB, lineIdA, lineIdB } = wordJobs[k];

          const vecsA = await computeWordVectors(wordsA.map((w) => w.text));
          const vecsB = await computeWordVectors(wordsB.map((w) => w.text));
          const wordPairs = alignWords(vecsA, vecsB);

          for (const { i, j } of wordPairs) {
            const wIdA = ensureNodeId(
              wordsA[i].node,
              `${lineIdA}-w${i + 1}`,
              docAChanged,
            );
            const wIdB = ensureNodeId(
              wordsB[j].node,
              `${lineIdB}-w${j + 1}`,
              docBChanged,
            );
            data.addAlignment(languageA, languageB, [wIdA], [wIdB], "Literal");
            wordLinks++;
          }

          setEmbedProgress({ done: k + 1, total: wordJobs.length });
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      // Persist any xml:id attributes we added (line and word level).
      const serializer = new XMLSerializer();
      if (docAChanged.value) {
        data.updateDocumentPerLanguage(
          languageA,
          serializer.serializeToString(docA),
        );
      }
      if (docBChanged.value) {
        data.updateDocumentPerLanguage(
          languageB,
          serializer.serializeToString(docB),
        );
      }

      setPhase("done");

      if (onAlignmentUpdated) {
        onAlignmentUpdated([languageA, languageB]);
      }

      showMessage(
        `Smart alignment complete! Created ${lineLinks} verse alignment${lineLinks !== 1 ? "s" : ""}` +
          (wordLinks > 0
            ? ` and ${wordLinks} word alignment${wordLinks !== 1 ? "s" : ""}.`
            : "."),
        "success",
      );
    } catch (error) {
      if (error.message !== "cancelled") {
        console.error("Smart alignment error:", error);
        showMessage(`Alignment failed: ${error.message}.`, "error");
      }
    } finally {
      setLoading(false);
      setDownloadDialog(false);
      setPhase("idle");
      setEmbedProgress({ done: 0, total: 0 });
      setCancelling(false);
    }
  };

  const selectedModel =
    AI_MODELS.find((m) => m.id === selectedModelId) ?? AI_MODELS[0];
  const selectedWordModel =
    WORD_MODELS.find((m) => m.id === selectedWordModelId) ?? WORD_MODELS[0];

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Alignment models
          </Typography>
          <Tooltip title="About Smart Alignment & models">
            <IconButton size="small" onClick={() => setAboutOpen(true)}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <FormControl fullWidth size="small" disabled={disabled || loading}>
          <InputLabel id="ai-model-label">Line model (sentences)</InputLabel>
          <Select
            labelId="ai-model-label"
            value={selectedModelId}
            label="Line model (sentences)"
            onChange={(e) => setSelectedModelId(e.target.value)}
          >
            {AI_MODELS.map((m) => (
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

        <FormControl fullWidth size="small" disabled={disabled || loading}>
          <InputLabel id="word-model-label">Word model</InputLabel>
          <Select
            labelId="word-model-label"
            value={selectedWordModelId}
            label="Word model"
            onChange={(e) => setSelectedWordModelId(e.target.value)}
          >
            {WORD_MODELS.map((m) => (
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
      </Box>

      <Button
        variant="contained"
        disabled={disabled || loading || languageA === "" || languageB === ""}
        onClick={performAlignment}
        {...props}
      >
        {loading ? (
          <CircularProgress size="24px" />
        ) : (
          `Smart Align (AI, ${selectedModel.size})`
        )}
      </Button>

      <Dialog open={downloadDialog} disableEscapeKeyDown>
        <DialogTitle>Smart Alignment</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {cancelling
              ? "Cancelling… waiting for current batch to finish."
              : phase === "loading"
                ? `Loading line model ${selectedModel.short} (${selectedModel.size})…`
                : phase === "computing"
                  ? `Computing embeddings: ${embedProgress.done} / ${embedProgress.total} texts`
                  : phase === "aligning"
                    ? "Finding best line alignments…"
                    : phase === "loadingWord"
                      ? `Loading word model ${selectedWordModel.short} (${selectedWordModel.size})…`
                      : phase === "aligningWords"
                        ? `Aligning words: ${embedProgress.done} / ${embedProgress.total} verses`
                        : "Complete!"}
          </DialogContentText>
          <Box sx={{ width: "100%" }}>
            {(phase === "loading" || phase === "loadingWord") && (
              <LinearProgress variant="indeterminate" />
            )}
            {(phase === "computing" || phase === "aligningWords") && (
              <>
                <LinearProgress
                  variant="determinate"
                  value={
                    embedProgress.total > 0
                      ? (embedProgress.done / embedProgress.total) * 100
                      : 0
                  }
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: "block" }}
                >
                  {embedProgress.total > 0
                    ? Math.round(
                        (embedProgress.done / embedProgress.total) * 100,
                      )
                    : 0}
                  %
                </Typography>
              </>
            )}
            {(phase === "aligning" || phase === "done") && (
              <LinearProgress
                variant={phase === "aligning" ? "indeterminate" : "determinate"}
                value={100}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {phase !== "done" && (
            <Button
              color="error"
              disabled={cancelling}
              onClick={() => {
                cancelledRef.current = true;
                setCancelling(true);
              }}
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </Button>
          )}
          {phase === "done" && (
            <Button onClick={() => setDownloadDialog(false)}>Close</Button>
          )}
        </DialogActions>
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
