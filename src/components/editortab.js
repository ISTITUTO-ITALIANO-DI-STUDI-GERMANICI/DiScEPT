import * as React from "react";
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Editor from "@monaco-editor/react";

import data from '../Data.js';
import CETEIWrapper from './ceteiwrapper.js';

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
      {value === index && (
        <Box sx={{ pt: 3 }}>{children}</Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function EditorTab({ visible, language }) {
  const [tab, setTab] = React.useState(0);
  const [content, setContent] = React.useState(data.getDocumentPerLanguage(language) || "");

  function handleEditorDidMount(editor, monaco) {
    editor.getModel().setValue(content);
  }

  function handleEditorChange(value, event) {
    data.updateDocumentPerLanguage(language, value);
    setContent(value);
  }

  return (
    <div hidden={!visible}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(event, newValue) => setTab(newValue)} aria-label="editor tab">
          <Tab label="Editor" {...a11yProps(0)} />
          <Tab label="Preview" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={tab} index={0}>
        <Editor
          height="90vh"
          defaultLanguage="xml"
          onMount={handleEditorDidMount}
          onChange={handleEditorChange} />
      </CustomTabPanel>
      <CustomTabPanel value={tab} index={1}>
        <CETEIWrapper tei={content} />
      </CustomTabPanel>
    </div>
   );
}
