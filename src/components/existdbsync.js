import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import data from "../Data.js";

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

  const savePrefs = () => {
    localStorage.setItem("exist-url", url);
    localStorage.setItem("exist-collection", collection);
    localStorage.setItem("exist-user", user);
  };

  const showError = (err) => {
    const map = {
      "exist-network": "Impossibile raggiungere eXistDB",
      "exist-fetch": "Errore nel recupero dei file",
      "exist-save": "Errore nel salvataggio dei dati",
      "exist-list": "Errore nel recupero della collezione",
    };
    alert(map[err.message] || err.message);
  };

  const load = async () => {
    savePrefs();
    try {
      await data.readFromExistDB(url, collection, user, password);
      setOpen(false);
    } catch (e) {
      showError(e);
    }
  };

  const save = async () => {
    savePrefs();
    try {
      await data.saveToExistDB(url, collection, user, password);
      setOpen(false);
    } catch (e) {
      showError(e);
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={load}>Load</Button>
          <Button onClick={save} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
