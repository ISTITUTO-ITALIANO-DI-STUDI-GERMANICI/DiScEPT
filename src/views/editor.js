import React from 'react';

import Grid from "@mui/material/Grid";
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from "@mui/material/TextField";

import Editor from "@monaco-editor/react";

import data from '../Data.js';

export default function EditorView() {
  const monacoRef = React.useRef(null);
  const [selectedLanguage, setSelectedLanguage] = React.useState(0);
  const [deletingLanguage, setDeletingLanguage] = React.useState("");
  const [addLanguageDialogShown, setAddLanguageDialogShown] = React.useState(false);
  const [addingLanguage, setAddingLanguage] = React.useState("");

  const loadDocument = index => {
    setSelectedLanguage(index);
    monacoRef.current.getModel().setValue(data.documents[index].body);
  };

  function handleEditorDidMount(editor, monaco) {
    monacoRef.current = editor;
    loadDocument(0);
  }

  function handleEditorChange(value, event) {
    data.documents[selectedLanguage].body = value;
  }

  function deleteLanguage(language) {
    setDeletingLanguage(language);
  }

  function closeDeleteDialog() {
    setDeletingLanguage("");
  }

  function deleteLanguageConfirmed() {
    data.documents = data.documents.filter(a => a.language !== deletingLanguage);
    closeDeleteDialog();
  }

  function showAddLanguageDialog() {
    setAddLanguageDialogShown(true);
  }

  function closeAddLanguageDialog() {
    setAddLanguageDialogShown(false);
  }

  function addLanguage() {
    closeAddLanguageDialog();

    const pos = data.documents.findIndex(a => a.language === addingLanguage);
    if (pos === -1) {
      data.documents.push({language: addingLanguage, body: ''})
      loadDocument(data.documents.length - 1);
    } else {
      loadDocument(pos);
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={9}>
        <Editor
          height="90vh"
          defaultLanguage="xml"
          onMount={handleEditorDidMount}
          onChange={handleEditorChange} />
      </Grid>
      <Grid item xs={3}>
        <List>{
          data.documents.map((doc, index) => (
            <ListItem disablePadding key={"list-language-" + index} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => deleteLanguage(doc.language)}>
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemButton onClick={() => loadDocument(index)}
                selected={selectedLanguage === index}>
                <ListItemText primary={doc.language} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding>
            <ListItemButton onClick={showAddLanguageDialog}>
              <ListItemText>Add a new language</ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </Grid>

      <Dialog
        open={deletingLanguage !== ""}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-language"
        aria-describedby="delete-language-desc"
      >
        <DialogTitle id="delete-language">
          {"Are you sure to delete this language?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-language-desc">
            Are you sure to delete this language? The operation cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={deleteLanguageConfirmed} autoFocus>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addLanguageDialogShown}
        onClose={closeAddLanguageDialog}
        aria-labelledby="add-language"
        aria-describedby="add-language-desc"
      >
        <DialogTitle id="add-language">
          {"Add a new language"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="add-language-desc">
            Write the language identifier for the new document.
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
            onChange={e => setAddingLanguage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddLanguageDialog}>Cancel</Button>
          <Button onClick={addLanguage} autoFocus>Add</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
