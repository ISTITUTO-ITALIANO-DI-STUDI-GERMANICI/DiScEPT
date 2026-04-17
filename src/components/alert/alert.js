import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { MSG } from "./messages.js";

const AlertContext = React.createContext(null);

// Resolves a path like "ERROR.ExistDB.Network"
const resolveMessage = (path) => {
  if (typeof path !== "string") return null;

  return path.split(".").reduce((acc, key) => acc?.[key], MSG);
};

// Get severity message from path
const getSeverityFromPath = (path) => {
  if (!path) return "info";

  const root = path.split(".")[0];

  switch (root) {
    case "ERROR":
      return "error";
    case "SUCCESS":
      return "success";
    case "INFO":
      return "info";
    case "WARN":
      return "warning";
    default:
      return "info";
  }
};

export function AlertProvider({ children }) {
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showAlert = React.useCallback((input, severity = "info", params = []) => {

    // Path string
    if (typeof input === "string" && input.includes(".")) {
      const resolved = resolveMessage(input);

      if (resolved) {
        const finalMessage =
          // I can have either a parametric string via anonymous function or a simple string
          typeof resolved === "function"
            ? resolved(...params)
            : resolved;

        setSnackbar({
          open: true,
          message: finalMessage,
          severity: getSeverityFromPath(input),
        });

        return;
      }
    }

  }, []);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
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
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = React.useContext(AlertContext);

  if (!ctx) {
    throw new Error("useAlert must be used within an AlertProvider");
  }

  return ctx;
}