import React from "react";

import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import EditorTab from "../components/editortab.js";
import Title from '../components/title.js';
import data from "../Data.js";
import { useAlert } from "../components/alert/alert.js";
import { MSG } from "../components/alert/messages";

const documentTemplate = (
  language,
) => `<TEI version="3.3.0" xmlns="http://www.tei-c.org/ns/1.0">
 <teiHeader>
  <fileDesc>
   <titleStmt>
    <title>${data.project.title}</title>
   </titleStmt>
   <publicationStmt>
    <p>${language}</p>
   </publicationStmt>
  </fileDesc>
  <profileDesc>
   <langUsage>
    <language ident="${language}">${language}</language>
   </langUsage>
  </profileDesc>
 </teiHeader>
 <text>
  <body>
    <div>
      <p><!-- Write something here --></p>
    </div>
  </body>
 </text>
</TEI>`;

/**   Replaces all occurrences of the old language identifier inside a TEI XML string:
 *      - <p>{oldLang}</p>  inside <publicationStmt>
 *      - <language ident="{oldLang}">{oldLang}</language>
 */
function renameLangInTei(teiContent, oldLang, newLang) {
  let updated = teiContent;

  // Replaces the language in <publicationStmt><p>...</p></publicationStmt>
  updated = updated.replace(
    new RegExp(`(<publicationStmt>[\\s\\S]*?<p>)${escapeRegex(oldLang)}(<\\/p>[\\s\\S]*?<\\/publicationStmt>)`),
    `$1${newLang}$2`,
  );

  // Replaces the language in <language ident="...">...</language>
  updated = updated.replace(
    new RegExp(`(<language\\s+ident=")${escapeRegex(oldLang)}(">)${escapeRegex(oldLang)}(<\\/language>)`),
    `$1${newLang}$2${newLang}$3`,
  );

  return updated;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function EditorView() {
  const dAlert = useAlert();

  const [selectedLanguage, setSelectedLanguage] = React.useState(
    data.getDocumentLanguages()[0],
  );

  // Delete state
  const [deletingLanguage, setDeletingLanguage] = React.useState("");

  // Add state
  const [addLanguageDialogShown, setAddLanguageDialogShown] =
    React.useState(false);
  const [addingLanguage, setAddingLanguage] = React.useState("");

  // Edit state
  const [editingLanguage, setEditingLanguage] = React.useState("");
  const [editedLanguage, setEditedLanguage] = React.useState("");

  // Delete handlers

  function deleteLanguage(language) {
    setDeletingLanguage(language);
  }

  function closeDeleteDialog() {
    setDeletingLanguage("");
  }

  function deleteLanguageConfirmed() {
    data.deleteDocumentPerLanguage(deletingLanguage);
    closeDeleteDialog();

    if (deletingLanguage === selectedLanguage) {
      const languages = data.getDocumentLanguages();
      setSelectedLanguage(languages.length ? languages[0] : "");
    }

    dAlert("SUCCESS.Translations.LanguageDeleted");
  }

  // Add handlers

  function showAddLanguageDialog() {
    setAddLanguageDialogShown(true);
  }

  function closeAddLanguageDialog() {
    setAddLanguageDialogShown(false);
  }

  function addLanguage() {
    if (!addingLanguage.trim()) {
      dAlert("WARN.Translations.EmptyLanguageField");
      return;
    }

    closeAddLanguageDialog();

    if (!data.getDocumentPerLanguage(addingLanguage)) {
      data.addDocumentPerLanguage(
        addingLanguage,
        documentTemplate(addingLanguage),
      );
      setSelectedLanguage(addingLanguage);
      dAlert("SUCCESS.Translations.LanguageAdded");
    }
  }

  // Edit handlers

  function showEditLanguageDialog(language) {
    setEditingLanguage(language);
    setEditedLanguage(language);
  }

  function closeEditLanguageDialog() {
    setEditingLanguage("");
    setEditedLanguage("");
  }

  function editLanguageConfirmed() {
    const oldLang = editingLanguage;
    const newLang = editedLanguage.trim();

    if (!newLang) {
      dAlert("WARN.Translations.EmptyLanguageField");
      return;
    }

    closeEditLanguageDialog();

    if (newLang === oldLang) return;
    if (data.getDocumentPerLanguage(newLang)) return; // already exists

    // Get the existing TEI content and patch the language identifiers
    const existingContent = data.getDocumentPerLanguage(oldLang);
    const updatedContent = renameLangInTei(existingContent, oldLang, newLang);

    // Removes the old key, add the new one with updated content
    data.deleteDocumentPerLanguage(oldLang);
    data.addDocumentPerLanguage(newLang, updatedContent);

    // Keep selection in sync
    if (selectedLanguage === oldLang) {
      setSelectedLanguage(newLang);
    }

    dAlert("SUCCESS.Translations.LanguageEdited");
  }

  // Render

  return (
    <Grid container spacing={3}>
      <Grid item xs={9}>
        <Title title="Edit the content" />
        {data.getDocumentLanguages().map((language) => (
          <EditorTab
            key={"editortab-" + language}
            visible={selectedLanguage === language}
            language={language}
          />
        ))}
      </Grid>
      <Grid item xs={3}>
        <List>
          {data.getDocumentLanguages().map((language, index) => (
            <ListItem
              disablePadding
              key={"list-language-" + index}
              id={"list-language-" + index}
              secondaryAction={
                <>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => showEditLanguageDialog(language)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => deleteLanguage(language)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemButton
                onClick={() => setSelectedLanguage(language)}
                selected={selectedLanguage === language}
              >
                <ListItemText primary={language} />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding>
            <ListItemButton
              id="editor-add-language"
              onClick={showAddLanguageDialog}
            >
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="Add a new language" />
            </ListItemButton>
          </ListItem>
        </List>
      </Grid>

      {/* Delete dialog */}
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
            Are you sure to delete this language? The operation cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={deleteLanguageConfirmed} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add dialog */}
      <Dialog
        open={addLanguageDialogShown}
        onClose={closeAddLanguageDialog}
        aria-labelledby="add-language"
        aria-describedby="add-language-desc"
      >
        <DialogTitle id="add-language">{"Add a new language"}</DialogTitle>
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
            onChange={(e) => setAddingLanguage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddLanguageDialog}>Cancel</Button>
          <Button onClick={addLanguage} autoFocus>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={editingLanguage !== ""}
        onClose={closeEditLanguageDialog}
        aria-labelledby="edit-language"
        aria-describedby="edit-language-desc"
      >
        <DialogTitle id="edit-language">{"Edit a language"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="edit-language-desc">
            Enter the new language identifier for the current document.
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="edit-language-field"
            name="language"
            label="Language"
            type="text"
            fullWidth
            variant="standard"
            value={editedLanguage}
            onChange={(e) => setEditedLanguage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditLanguageDialog}>Cancel</Button>
          <Button onClick={editLanguageConfirmed} autoFocus>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

const EditorOnboarding = [
  {
    popover: {
      title: "Editor section",
      description:
        "Manage the TEI sources for each language. Select a language, edit the XML and switch to the preview tab to see the result.",
    },
  },
  {
    element: "#editor-add-language",
    popover: {
      title: "Add language",
      description: "Create a new TEI document for another language.",
    },
  },
  // TODO: dynamic add a language if needed
];

export { EditorView, EditorOnboarding };