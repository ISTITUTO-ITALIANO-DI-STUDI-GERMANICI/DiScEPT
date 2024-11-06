// Import necessary modules and components
import * as React from "react";
import PropTypes from "prop-types";            // Prop types validation for components
import Tabs from "@mui/material/Tabs";         // Tabs component from Material-UI for tab navigation
import Tab from "@mui/material/Tab";           // Individual Tab component within Tabs
import Typography from "@mui/material/Typography"; // Typography component for consistent text styling
import Box from "@mui/material/Box";           // Box component for layout structure
import Editor from "@monaco-editor/react";     // Monaco editor, a code editor component

import data from "../Data.js";                 // Custom data module for document handling
import CETEIWrapper from "./ceteiwrapper.js";  // Custom component for rendering TEI XML as HTML5

// CustomTabPanel Component - Manages the display of each tab panel, showing only the active tab
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"                          // Accessibility role for a tab panel
      hidden={value !== index}                 // Hides the panel if it is not active
      id={`simple-tabpanel-${index}`}          // Unique ID for accessibility
      aria-labelledby={`simple-tab-${index}`}  // Associates panel with its tab for accessibility
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>} // Displays content if active
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
    id: `simple-tab-${index}`,                 // ID for each tab
    "aria-controls": `simple-tabpanel-${index}`, // Links tab to its panel
  };
}

// EditorTab Component - Main component with tabs for editing and previewing TEI XML content
export default function EditorTab({ visible, language }) {
  const [tab, setTab] = React.useState(0);      // State to manage active tab
  const [content, setContent] = React.useState(
    data.getDocumentPerLanguage(language) || "", // Initialize content based on selected language
  );

  // Sets initial content in the editor when the editor mounts
  function handleEditorDidMount(editor, monaco) {
    editor.getModel().setValue(content);        // Sets editor's content to match 'content' state
  }

  // Handles changes in the editor, updates state and persists the content per language
  function handleEditorChange(value, event) {
    data.updateDocumentPerLanguage(language, value); // Updates content in data storage
    setContent(value);                               // Updates 'content' state
  }

  return (
    <div hidden={!visible}>  // Only renders component if 'visible' prop is true
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}> {/* Tabs container with bottom border */}
        <Tabs
          value={tab}                             // Active tab index
          onChange={(event, newValue) => setTab(newValue)} // Sets active tab
          aria-label="editor tab"                 // Accessibility label for the tab group
        >
          <Tab label="Editor" {...a11yProps(0)} /> // First tab labeled "Editor"
          <Tab label="Preview" {...a11yProps(1)} /> // Second tab labeled "Preview"
        </Tabs>
      </Box>
      <CustomTabPanel value={tab} index={0}>  // Tab panel for the editor
        <Editor
          height="90vh"                        // Editor height
          defaultLanguage="xml"                // Default language for syntax highlighting
          onMount={handleEditorDidMount}       // Called when editor mounts
          onChange={handleEditorChange}        // Updates content when editor text changes
        />
      </CustomTabPanel>
      <CustomTabPanel value={tab} index={1}>  // Tab panel for the preview
        <CETEIWrapper tei={content} />        // Renders content using CETEIWrapper component
      </CustomTabPanel>
    </div>
  );
}
