// Import necessary modules and components
import * as React from "react";
import PropTypes from "prop-types"; // Prop types validation for components
import Tabs from "@mui/material/Tabs"; // Tabs component from Material-UI for tab navigation
import Tab from "@mui/material/Tab"; // Individual Tab component within Tabs
import Typography from "@mui/material/Typography"; // Typography component for consistent text styling
import Box from "@mui/material/Box"; // Box component for layout structure
import Editor from "@monaco-editor/react"; // Monaco editor, a code editor component

import data from "../Data.js"; // Custom data module for document handling
import CETEIWrapper from "./ceteiwrapper.js"; // Custom component for rendering TEI XML as HTML5

// CustomTabPanel Component - Manages the display of each tab panel, showing only the active tab
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// PropTypes for CustomTabPanel - Ensures 'index' and 'value' are required numbers, 'children' can be any node
CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

// a11yProps Function - Generates accessibility props for each Tab component
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`, // ID for each tab
    "aria-controls": `simple-tabpanel-${index}`, // Links tab to its panel
  };
}

// EditorTab Component - Main component with tabs for editing and previewing TEI XML content
export default function EditorTab({ visible, language }) {
  const [tab, setTab] = React.useState(0); // State to manage active tab
  const [content, setContent] = React.useState(
    data.getDocumentPerLanguage(language) || "", // Initialize content based on selected language
  );

  // Sets initial content in the editor when the editor mounts
  function handleEditorDidMount(editor, monaco) {
    editor.getModel().setValue(content); // Sets editor's content to match 'content' state
  }

  // Handles changes in the editor, updates state and persists the content per language
  function handleEditorChange(value, event) {
    data.updateDocumentPerLanguage(language, value); // Updates content in data storage
    setContent(value); // Updates 'content' state
  }

  return (
    <div hidden={!visible}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tab}
          onChange={(event, newValue) => setTab(newValue)}
          aria-label="editor tab"
        >
          <Tab label="Editor" {...a11yProps(0)} />
          <Tab label="Preview" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={tab} index={0}>
        <Editor
          height="90vh"
          defaultLanguage="xml"
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        />
      </CustomTabPanel>
      <CustomTabPanel value={tab} index={1}>
        <CETEIWrapper tei={content} />
      </CustomTabPanel>
    </div>
  );
}
