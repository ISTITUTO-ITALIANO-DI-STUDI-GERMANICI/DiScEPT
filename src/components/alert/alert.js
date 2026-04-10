import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import messages from "./messages.json";

const AlertContext = React.createContext(null);

// The main component that can be used in any sub component
export function AlertProvider({ children }) {
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: "",
    severity: "info",
  });

  // We can get our message from the specific code
  const findMessageByCode = React.useCallback((code) => {
    for (const category of messages.messages) {
      const found = category.messages.find((msg) => msg.code === code);

      // If I find that code I extract both severity and the text itself
      if (found) {
        return {
          text: found.text,
          severity: category.category,
        };
      }
    }

    return {
      text: `Unknown message code: ${code}`,
      severity: "warning",
    };
  }, []);

  const showAlert = React.useCallback(
    (input, severity = "info") => {

      // If it's a custom message (repeated once for example, or new ones)
      if (typeof input === "object" && input !== null) {
        setSnackbar({
          open: true,
          message: input.prefix
            ? `${input.prefix}: ${input.message}`
            : input.message,
          severity: input.severity || "info",
        });

        return;
      }

      // With an internal message code (from messages.json)
      const isCode = typeof input === "string" && /^[A-Z]\d+$/i.test(input);

      if (isCode) {
        const result = findMessageByCode(input);

        // Let's show also the related code for a more complete message
        setSnackbar({
          open: true,
          message: "[" + input + "] " + result.text,
          severity: result.severity,
        });

        return;
      }

      // If it's a free string
      setSnackbar({
        open: true,
        message: input,
        severity,
      });
    },
    [findMessageByCode]
  );

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