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
import Typography from "@mui/material/Typography";

import EditorOrMessage from '../components/editorormessage.js';
import data from '../Data.js';

const documentTemplate = (language) => `<TEI version="3.3.0" xmlns="http://www.tei-c.org/ns/1.0">
 <teiHeader>
  <fileDesc>
   <titleStmt>
    <title>${data.project.title} - language: ${language}</title>
   </titleStmt>
   <publicationStmt>
    <p>${language}</p>
   </publicationStmt>
  </fileDesc>
 </teiHeader>
 <text>
  <body>
    <!-- Write something here -->
  </body>
 </text>
</TEI>`;


export default function EditorView() {
  const monacoRef = React.useRef(null);
  const languageRef = React.useRef("");

  const [selectedLanguage, setSelectedLanguage] = React.useState(-1);
  const [deletingLanguage, setDeletingLanguage] = React.useState("");
  const [addLanguageDialogShown, setAddLanguageDialogShown] = React.useState(false);
  const [addingLanguage, setAddingLanguage] = React.useState("");
  const [activeEditor, setActiveEditor] = React.useState(false);

  const loadDocument = language => {
    languageRef.current = language;
    setSelectedLanguage(language);

    if (monacoRef.current) {
      monacoRef.current.getModel().setValue(data.getDocumentPerLanguage(language));
    } else {
      setActiveEditor(true);
    }
  };

  function handleEditorDidMount(editor, monaco) {
    monacoRef.current = editor;
    if (data.getDocumentPerLanguage(languageRef.current)) {
      loadDocument(languageRef.current);
    }
  }

  function handleEditorChange(value, event) {
    if (languageRef.current !== "") {
      data.updateDocumentPerLanguage(languageRef.current, value);
    }
  }

  function deleteLanguage(language) {
    setDeletingLanguage(language);
  }

  function closeDeleteDialog() {
    setDeletingLanguage("");
  }

  function deleteLanguageConfirmed() {
    data.deleteDocumentPerLanguage(deletingLanguage);
    closeDeleteDialog();

    if (deletingLanguage === languageRef.current) {
      const languages = data.getDocumentLanguages()
      languageRef.current = languages.length ? languages[0] : "";
    }
    setSelectedLanguage(languageRef.current);
  }

  function showAddLanguageDialog() {
    setAddLanguageDialogShown(true);
  }

  function closeAddLanguageDialog() {
    setAddLanguageDialogShown(false);
  }

  function addLanguage() {
    closeAddLanguageDialog();

    if (!data.getDocumentPerLanguage(addingLanguage)) {
      data.addDocumentPerLanguage(addingLanguage,  documentTemplate(addingLanguage));
    }

    loadDocument(addingLanguage);
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={9}>
        <Typography variant="h3" gutterBottom>Edit the content</Typography>
        <EditorOrMessage message="Please, add the first language." active={activeEditor} onMount={handleEditorDidMount} onChange={handleEditorChange} />
      </Grid>
      <Grid item xs={3}>
        <List>{
          data.getDocumentLanguages().map(language => (
            <ListItem disablePadding key={"list-language-" + language} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => deleteLanguage(language)}>
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemButton onClick={() => loadDocument(language)}
                selected={selectedLanguage === language}>
                <ListItemText primary={language} />
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
