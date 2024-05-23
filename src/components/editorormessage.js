import * as React from "react";
import Typography from "@mui/material/Typography";
import Editor from "@monaco-editor/react";

export default function EditorOrMessage({ active, message, onMount, onChange }) {
  if (!active) {
    return <Typography>{message}</Typography>
  }

  return <Editor
          height="90vh"
          defaultLanguage="xml"
          onMount={onMount}
          onChange={onChange} />
}
