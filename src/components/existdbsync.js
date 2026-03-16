import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import data from "../Data.js";

const ERROR_MESSAGES = {
  "exist-network": "Unable to connect to eXistDB. Please check URLs and your network.",
  "exist-fetch": "Error occurred while fetching files from the collection.",
  "exist-save": "Error occurred while saving the document to eXistDB.",
  "exist-list": "Error occurred while fetching the file list from the collection.",
};

export default function ExistDBSync() {
  const [open, setOpen] = React.useState(false);
  const [url, setUrl] = React.useState(
    localStorage.getItem("exist-url") || "http://localhost:8080/exist",
  );
  const [collection, setCollection] = React.useState(
    localStorage.getItem("exist-collection") || "/db",
  );
  const [user, setUser] = React.useState(
    localStorage.getItem("exist-user") || "",
  );
  const [password, setPassword] = React.useState("");
  const [proxy, setProxy] = React.useState(
    localStorage.getItem("exist-proxy") || "",
  );

  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const savePrefs = () => {
    localStorage.setItem("exist-url", url);
    localStorage.setItem("exist-collection", collection);
    localStorage.setItem("exist-user", user);
    localStorage.setItem("exist-proxy", proxy);
  };

  const load = async () => {
    savePrefs();
    try {
      await data.readFromExistDB(url, collection, user, password, proxy);
      setOpen(false);
      showSnackbar("Document loaded correctly from eXistDB.", "success");
    } catch (e) {
      const msg = ERROR_MESSAGES[e.message] || e.message;
      showSnackbar(msg, "error");
    }
  };

  const save = async () => {
    savePrefs();
    try {
      await data.saveToExistDB(url, collection, user, password, proxy);
      setOpen(false);
      showSnackbar("Document saved correctly on eXistDB.", "success");
    } catch (e) {
      const msg = ERROR_MESSAGES[e.message] || e.message;
      showSnackbar(msg, "error");
    }
  };

  return (
    <>
      <Tooltip title="Sync eXistDB">
        <IconButton color="inherit" onClick={() => setOpen(true)}>
          <SyncIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>eXistDB Sync</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
        >
          <TextField
            label="Base URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
          />
          <TextField
            label="Collection"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            fullWidth
          />
          <TextField
            label="User"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <TextField
            label="Proxy URL (optional)"
            value={proxy}
            onChange={(e) => setProxy(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={load}>Load</Button>
          <Button onClick={save} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}