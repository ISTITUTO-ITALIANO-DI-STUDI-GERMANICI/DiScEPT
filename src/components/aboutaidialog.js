import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const MODELS_INFO = [
  {
    id: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
    short: "MiniLM L12",
    size: "~120 MB",
    languages: "50",
    quality: "Good",
    speed: "Fast",
    bestFor: "Common European languages (DE, EN, IT, FR, ES, NL, …)",
  },
  {
    id: "Xenova/multilingual-e5-small",
    short: "E5 small",
    size: "~120 MB",
    languages: "100",
    quality: "Good",
    speed: "Fast",
    bestFor: "Broader coverage: Slavic, Nordic, Asian, classical languages",
  },
  {
    id: "Xenova/multilingual-e5-base",
    short: "E5 base",
    size: "~280 MB",
    languages: "100",
    quality: "Better",
    speed: "Moderate",
    bestFor: "Same coverage as E5 small, higher embedding quality",
  },
  {
    id: "Xenova/LaBSE",
    short: "LaBSE",
    size: "~500 MB",
    languages: "109",
    quality: "High",
    speed: "Moderate",
    bestFor: "Language-agnostic BERT — strong on rare and classical languages",
  },
];

export default function AboutAIDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>About Smart Alignment</DialogTitle>
      <DialogContent dividers>

        <Typography variant="h6" gutterBottom>How it works</Typography>
        <Typography variant="body2" paragraph>
          Smart Align computes dense sentence embeddings for every text element
          in both documents, then finds the best order-preserving (monotone)
          alignment using dynamic programming — similar to the Needleman–Wunsch
          algorithm used in bioinformatics for sequence alignment.
        </Typography>
        <Typography variant="body2" paragraph>
          Everything runs <strong>entirely in your browser</strong>. No text is
          ever sent to a server. The model is downloaded once from Hugging Face
          and then cached locally.
        </Typography>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Available models</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Model</strong></TableCell>
              <TableCell><strong>Size</strong></TableCell>
              <TableCell><strong>Languages</strong></TableCell>
              <TableCell><strong>Quality</strong></TableCell>
              <TableCell><strong>Speed</strong></TableCell>
              <TableCell><strong>Best for</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MODELS_INFO.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{m.short}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.id}</Typography>
                </TableCell>
                <TableCell>{m.size}</TableCell>
                <TableCell>{m.languages}</TableCell>
                <TableCell>{m.quality}</TableCell>
                <TableCell>{m.speed}</TableCell>
                <TableCell>
                  <Typography variant="caption">{m.bestFor}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ mt: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>Tip:</strong> If your language pair is not among the most
            common European languages, choose <em>E5 small</em> or <em>E5 base</em>
            — they cover 100 languages including Nordic, Slavic, Asian, and
            classical languages. MiniLM only covers 50 languages and may produce
            poor results outside that set.
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Alignment algorithm</Typography>
        <Typography variant="body2" paragraph>
          After computing embeddings, the tool builds a full similarity matrix
          (cosine similarity between every pair of paragraphs) and runs a
          DP-based alignment that maximises the total similarity while
          guaranteeing monotonicity — i.e. if paragraph <em>i</em> is aligned
          to paragraph <em>j</em>, then the next alignment will always pick a
          paragraph after <em>j</em>. Pairs whose similarity falls below a
          minimum threshold are skipped.
        </Typography>
        <Typography variant="body2">
          Complexity is O(n × m) where n and m are the number of text elements
          in each document — fast enough for hundreds of paragraphs.
        </Typography>

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
