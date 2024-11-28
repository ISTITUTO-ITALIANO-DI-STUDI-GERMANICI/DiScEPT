// Import necessary modules and components from React and Material-UI
import * as React from "react";
import Dialog from "@mui/material/Dialog"; // Dialog components for modal dialogs
import DialogActions from "@mui/material/DialogActions"; // Container for dialog actions (buttons)
import DialogContent from "@mui/material/DialogContent"; // Container for dialog content
import DialogContentText from "@mui/material/DialogContentText"; // Content text with default styling
import DialogTitle from "@mui/material/DialogTitle"; // Dialog title
import Button from "@mui/material/Button"; // Button component
import TextField from "@mui/material/TextField"; // TextField for user input

import data from "../Data.js"; // Custom data module for handling file data

// DisceptFileUploader Component - Handles file upload with validation, error handling, and modal dialogs
export default function DisceptFileUploader({ fileUploaded, onChange }) {
  // Local state for file handling, dialog visibility, and language input
  const [file, setFile] = React.useState(null);
  const [overwriteDialogShown, setOverwriteDialogShown] = React.useState(false);
  const [genericErrorDialogShown, setGenericErrorDialogShown] =
    React.useState(false);
  const [noDisceptDialogShown, setNoDisceptDialogShown] = React.useState(false);
  const [loadCompletedDialogShown, setLoadCompletedDialogShown] =
    React.useState(false);
  const [addingLanguage, setAddingLanguage] = React.useState(""); // Stores user input for language name

  // Triggers when file loading completes successfully, showing a confirmation dialog
  function fileLoaded() {
    setLoadCompletedDialogShown(true);
  }

  // Closes the success dialog and triggers a callback to notify parent component of changes
  function closeLoadCompletedDialog() {
    setLoadCompletedDialogShown(false);
    onChange();
  }

  // Reads the file using data.readFromFile, then calls fileLoaded or catchError for success/failure
  function readFile(file) {
    data.readFromFile(file).then(fileLoaded, catchError);
  }

  // Watches file prop and initiates file processing if a new file is uploaded
  if (file !== fileUploaded) {
    setFile(fileUploaded);

    if (data.isChanged) {
      setOverwriteDialogShown(true); // If there are unsaved changes, show overwrite confirmation dialog
    } else {
      readFile(fileUploaded); // Otherwise, proceed to read the new file
    }
  }

  // Closes the overwrite confirmation dialog
  function closeOverwriteDialog() {
    setOverwriteDialogShown(false);
  }

  // Overwrites the existing file after confirmation from the user
  function overwriteFile() {
    closeOverwriteDialog();
    readFile(file);
  }

  // Handles different error cases when file reading fails
  function catchError(err) {
    switch (err.message) {
      case "no-discept": // Error indicating that the file isn't in the DiScEPT format
        setNoDisceptDialogShown(true);
        break;
      case "invalid": // Default error case for general file reading issues
      default:
        setGenericErrorDialogShown(true);
        break;
    }
  }

  // Closes the generic error dialog
  function closeGenericErrorDialog() {
    setGenericErrorDialogShown(false);
  }

  // Closes the dialog for files that aren't in the DiScEPT format
  function closeNoDisceptDialog() {
    setNoDisceptDialogShown(false);
  }

  // Adds the file as a document in a new language specified by the user and triggers onChange
  function addLanguage() {
    closeNoDisceptDialog();
    data.addFileDocumentPerLanguage(addingLanguage, file);
    onChange();
  }

  // Returns the JSX structure containing modal dialogs for each step in the file upload process
  return (
    <>
      {/* Dialog for successful file load */}
      <Dialog
        open={loadCompletedDialogShown}
        onClose={closeLoadCompletedDialog}
        aria-labelledby="loadCompleted-dialog"
        aria-describedby="loadCompleted-dialog-desc"
      >
        <DialogTitle id="loadCompleted-dialog">{"Data imported!"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="loadCompleted-dialog-desc">
            The file has been correctly imported!
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLoadCompletedDialog}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for overwrite confirmation */}
      <Dialog
        open={overwriteDialogShown}
        onClose={closeOverwriteDialog}
        aria-labelledby="overwrite-dialog"
        aria-describedby="overwrite-dialog-desc"
      >
        <DialogTitle id="overwrite-dialog">
          {"Changes will be overwritten!"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="overwrite-dialog-desc">
            Please confirm you want to upload this new file and overwrite the
            existing changes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeOverwriteDialog}>Cancel</Button>
          <Button onClick={overwriteFile} autoFocus>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for generic error */}
      <Dialog
        open={genericErrorDialogShown}
        onClose={closeGenericErrorDialog}
        aria-labelledby="generic-error-dialog"
        aria-describedby="generic-error-dialog-desc"
      >
        <DialogTitle id="generic-error-dialog">
          {"Something went wrong!"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="generic-error-dialog-desc">
            The uploaded file cannot be read correctly.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeGenericErrorDialog}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for non-DiScEPT file format with option to add as a new language */}
      <Dialog
        open={noDisceptDialogShown}
        onClose={closeNoDisceptDialog}
        aria-labelledby="no-discept"
        aria-describedby="no-discept-desc"
      >
        <DialogTitle id="no-discept">{"Valid TEI, but..."}</DialogTitle>
        <DialogContent>
          <DialogContentText id="no-discept-desc">
            The uploaded file does not appear to be a DiScEPT TEI model. Do you
            want to import it as a language instead?
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="language"
            name="language"
            label="Language"
            type="text"
            fullWidth
            variant="standard"
            onChange={(e) => setAddingLanguage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNoDisceptDialog}>Cancel</Button>
          <Button onClick={addLanguage} autoFocus>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
