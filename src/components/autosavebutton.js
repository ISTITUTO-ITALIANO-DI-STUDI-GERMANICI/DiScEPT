/* A self-contained icon button in the AppBar showing auto-save status with restoring. */

import * as React from "react";
import IconButton        from "@mui/material/IconButton";
import Tooltip           from "@mui/material/Tooltip";
import Dialog            from "@mui/material/Dialog";
import DialogTitle       from "@mui/material/DialogTitle";
import DialogContent     from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions     from "@mui/material/DialogActions";
import Button            from "@mui/material/Button";
import CloudDoneIcon     from "@mui/icons-material/CloudDone";
import CachedIcon        from "@mui/icons-material/Cached";

import { hasSaved, save, restore, savedAt } from "../autosave.js";
import data from "../Data.js";

// How often (ms) to poll for content changes
const POLL_MS = 500;

// How long (ms) the "saving" state is shown before switching to "saved"
const SAVING_MS = 600;

// Dot colours
const COLOR_SAVED  = "#5E9278"; // Sage green — matches the app theme
const COLOR_SAVING = "#F5A623"; // Amber yellow — signals activity

// CSS injected once into the document head
const STYLE = `
  @keyframes discept-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes discept-dot-pulse {
    0%, 100% { opacity: 1;    transform: scale(1);   }
    50%       { opacity: 0.35; transform: scale(0.7); }
  }
  @keyframes discept-fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .discept-fadein {
    animation: discept-fadein 350ms ease forwards;
  }
  .discept-spin {
    animation: discept-spin 900ms linear infinite;
  }
  .discept-dot-saving {
    animation: discept-dot-pulse 700ms ease-in-out infinite;
  }
  .discept-dot-saved {
    transition: background-color 400ms ease;
  }
`;

// Dot — shared by both icon states
function Dot({ saving }) {
  return (
    <span
      className={saving ? "discept-dot-saving" : "discept-dot-saved"}
      style={{
        position:        "absolute",
        top:             2,
        right:           2,
        width:           8,
        height:          8,
        borderRadius:    "50%",
        backgroundColor: saving ? COLOR_SAVING : COLOR_SAVED,
        border:          "1.5px solid white",
      }}
    />
  );
}

export default function AutoSaveButton({ onRestored }) {
  // "idle"   → button hidden (no snapshot yet)
  // "saving" → CachedIcon spinning + yellow dot
  // "saved"  → CloudDoneIcon + green dot
  const [status, setStatus] = React.useState(() => hasSaved() ? "saved" : "idle");

  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Initialise with current TEI so the first poll never triggers a spurious save
  const lastSavedTEI = React.useRef(data.generateTEI());

  // Track the change timestamp independently of the write time
  const changedAtRef = React.useRef(savedAt());

  // Inject styles once on mount
  React.useEffect(() => {
    if (document.getElementById("discept-autosave-style")) return;
    const tag = document.createElement("style");
    tag.id = "discept-autosave-style";
    tag.textContent = STYLE;
    document.head.appendChild(tag);
  }, []);

  // Polling loop — saves only on real content changes
  React.useEffect(() => {
    const timer = setInterval(() => {
      const currentTEI = data.generateTEI();
      if (currentTEI === lastSavedTEI.current) return; // Nothing changed — skip

      // Record the moment of the change (not the write)
      changedAtRef.current = new Date().toISOString();

      // Show spinning icon, persist, then fade into saved icon
      setStatus("saving");
      save(changedAtRef.current);
      lastSavedTEI.current = currentTEI;

      setTimeout(() => setStatus("saved"), SAVING_MS);
    }, POLL_MS);

    return () => clearInterval(timer); // Clear on unmount
  }, []);

  // Hidden until the first save
  if (status === "idle") return null;

  const isSaving = status === "saving";

  /** Attempt restore and close the dialog. */
  const handleRestore = () => {
    const ok = restore();
    setDialogOpen(false);
    if (ok) {
      lastSavedTEI.current = data.generateTEI(); // Sync ref so next poll is clean
      setStatus("saved");
      if (onRestored) onRestored();
    }
    // On failure: leave button visible; restore() logs the error to the console.
  };

  const when = changedAtRef.current
    ? new Date(changedAtRef.current).toLocaleString()
    : "unknown time";

  return (
    <>
      <Tooltip title={`Last saved: ${when}`}>
        <IconButton
          color="inherit"
          onClick={() => setDialogOpen(true)}
          sx={{ position: "relative", width: 40, height: 40 }}
        >
          {/*
            key={status} forces React to unmount the old icon and mount the new one
            on every state change — the fadeIn animation then plays on the fresh element.
          */}
          <span
            key={status}
            className="discept-fadein"
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isSaving
              ? <CachedIcon className="discept-spin" fontSize="small" />
              : <CloudDoneIcon fontSize="small" />
            }
          </span>

          {/* Dot sits outside the keyed span so it transitions smoothly */}
          <Dot saving={isSaving} />
        </IconButton>
      </Tooltip>

      {/* Restore confirmation dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="autosave-dialog-title"
        aria-describedby="autosave-dialog-desc"
      >
        <DialogTitle id="autosave-dialog-title">
          Restore auto-saved work
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="autosave-dialog-desc">
            A snapshot saved on <strong>{when}</strong> is available.
            Restoring it will overwrite your current session.
            Do you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestore} variant="contained" autoFocus>
            Restore
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}