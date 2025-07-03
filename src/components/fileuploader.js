// Import necessary modules and components from React and Material-UI
import * as React from "react";
import Dialog from "@mui/material/Dialog"; // Dialog components for modal dialogs
import DialogActions from "@mui/material/DialogActions"; // Container for dialog actions (buttons)
import DialogContent from "@mui/material/DialogContent"; // Container for dialog content
import DialogContentText from "@mui/material/DialogContentText"; // Content text with default styling
import DialogTitle from "@mui/material/DialogTitle"; // Dialog title
import Button from "@mui/material/Button"; // Button component
import FormControl from "@mui/material/FormControl"; // Form control for dropdown
import InputLabel from "@mui/material/InputLabel"; // Label for form control
import Select from "@mui/material/Select"; // Select dropdown component
import MenuItem from "@mui/material/MenuItem"; // Menu items for select

import data from "../Data.js"; // Custom data module for handling file data
import { parseTEIFile } from "../TEIUtils.js";

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
  const [addingLanguage, setAddingLanguage] = React.useState(""); // Stores selected language from dropdown
  
  // Predefined list of supported languages
  const LANGUAGES = [
    { code: "it", name: "Italian" },
    { code: "en", name: "English" },
    { code: "de", name: "German" },
    { code: "fr", name: "French" },
    { code: "es", name: "Spanish" }
  ];

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

  // Check if the uploaded file is a DiScEPT TEI or just plain TEI
  async function detectFile(file) {
    try {
      const { isDiscept } = await parseTEIFile(file);

      if (!isDiscept) {
        setNoDisceptDialogShown(true);
      } else if (data.isChanged) {
        setOverwriteDialogShown(true);
      } else {
        readFile(file);
      }
    } catch (err) {
      catchError(err);
    }
  }

  // Watches file prop and initiates file processing if a new file is uploaded
  if (file !== fileUploaded) {
    setFile(fileUploaded);
    detectFile(fileUploaded);
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
          <FormControl fullWidth margin="dense" variant="standard">
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              id="language-select"
              value={addingLanguage}
              label="Language"
              onChange={(e) => setAddingLanguage(e.target.value)}
              autoFocus
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNoDisceptDialog}>Cancel</Button>
          <Button onClick={addLanguage} disabled={!addingLanguage} autoFocus>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
