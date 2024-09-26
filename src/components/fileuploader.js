import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

import data from "../Data.js";

export default function DisceptFileUploader({ fileUploaded, onChange }) {
  const [file, setFile] = React.useState(null);
  const [overwriteDialogShown, setOverwriteDialogShown] = React.useState(false);
  const [genericErrorDialogShown, setGenericErrorDialogShown] =
    React.useState(false);
  const [noDisceptDialogShown, setNoDisceptDialogShown] = React.useState(false);
  const [loadCompletedDialogShown, setLoadCompletedDialogShown] =
    React.useState(false);
  const [addingLanguage, setAddingLanguage] = React.useState("");

  function fileLoaded() {
    setLoadCompletedDialogShown(true);
  }

  function closeLoadCompletedDialog() {
    setLoadCompletedDialogShown(false);
    onChange();
  }

  function readFile(file) {
    data.readFromFile(file).then(fileLoaded, catchError);
  }

  if (file !== fileUploaded) {
    setFile(fileUploaded);

    if (data.isChanged) {
      setOverwriteDialogShown(data.isChanged);
      // We will continue when the dialog is dismised.
    } else {
      readFile(fileUploaded);
    }
  }

  function closeOverwriteDialog() {
    setOverwriteDialogShown(false);
  }

  function overwriteFile() {
    closeOverwriteDialog();
    readFile(file);
  }

  function catchError(err) {
    switch (err.message) {
      case "no-discept":
        setNoDisceptDialogShown(true);
        break;

      case "invalid":
      default:
        setGenericErrorDialogShown(true);
        break;
    }
  }

  function closeGenericErrorDialog() {
    setGenericErrorDialogShown(false);
  }

  function closeNoDisceptDialog() {
    setNoDisceptDialogShown(false);
  }

  function addLanguage() {
    closeNoDisceptDialog();
    data.addFileDocumentPerLanguage(addingLanguage, file);
    onChange();
  }

  return (
    <>
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
            existing changes
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeOverwriteDialog}>Cancel</Button>
          <Button onClick={overwriteFile} autoFocus>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={genericErrorDialogShown}
        onClose={closeGenericErrorDialog}
        aria-labelledby="generic-error-dialog"
        aria-describedby="generic-error-dialog-desc"
      >
        <DialogTitle id="generic-error-dialog">
          {"Something wrong happened!"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="generic-error-dialog-desc">
            The uploaded file cannot be read correctly
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeGenericErrorDialog}>OK</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={noDisceptDialogShown}
        onClose={closeNoDisceptDialog}
        aria-labelledby="no-discept"
        aria-describedby="no-discept-desc"
      >
        <DialogTitle id="no-discept">{"Valid TEI But..."}</DialogTitle>
        <DialogContent>
          <DialogContentText id="no-discept-desc">
            The uploaded file does not look like a DiScEPT TEI model. Do you
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
