import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CodeIcon from "@mui/icons-material/Code";
import VisibilityIcon from "@mui/icons-material/Visibility";

import data from "../Data.js";
import InteractiveXMLViewer from "./interactivexmlviewer.js";

/**
 * AlignTab component provides a user interface for selecting a language,
 * displaying language-specific content, and enabling user interactions
 * with TEI (Text Encoding Initiative) elements.
 */
class AlignTab extends React.Component {
  constructor(props) {
    super(props);

    // Initial state includes selected language, view mode, and refresh tracking
    this.state = {
      language: "",
      lastRefresh: 0,
      viewMode: 'rendered', // 'rendered' hides tags, 'xml' shows tags
      refreshKey: 0 // Used to force re-render of InteractiveXMLViewer
    };

    // Reference to InteractiveXMLViewer's content (needed for selectAll/deselectAll)
    this.contentRef = React.createRef();
    this.viewerRef = React.createRef();
  }

  componentDidMount() {
    // Link contentRef to viewer's internal contentRef
    if (this.viewerRef.current) {
      this.contentRef.current = this.viewerRef.current.contentRef.current;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // Check if a refresh is needed based on props change
    if (
      this.props.refreshNeeded !== prevProps.refreshNeeded &&
      this.props.refreshNeeded !== this.state.lastRefresh &&
      this.state.language
    ) {
      this.setState({
        lastRefresh: this.props.refreshNeeded,
        refreshKey: this.state.refreshKey + 1
      });
    }

    // Check if alignment documents were updated
    if (this.props.alignmentUpdated !== prevProps.alignmentUpdated &&
        this.state.language &&
        this.props.alignmentUpdated?.includes(this.state.language)) {
      this.setState({ refreshKey: this.state.refreshKey + 1 });
    }

    // Update contentRef pointer when viewer changes
    if (this.viewerRef.current) {
      this.contentRef.current = this.viewerRef.current.contentRef.current;
    }
  }

  /**
   * Configures interactive logic for a TEI element.
   * Sets click and hover events to change the appearance and behavior of TEI elements.
   * Allows selection of both leaf elements and parent elements with children.
   *
   * @param {HTMLElement} domElm - The DOM element being configured.
   * @param {HTMLElement} teiElm - The TEI element related to domElm.
   */
  alignLogic = (domElm, teiElm) => {
    domElm.addEventListener("click", (e) => {
      this.props.onSelectionChanged(domElm, teiElm, domElm.parentElement);
      e.stopPropagation();
    });

    domElm.addEventListener("mouseenter", (e) => {
      if (!domElm.classList.contains("selectedTEI")) {
        domElm.classList.add("selectableTEI");
      }
      e.stopPropagation();
    });

    domElm.addEventListener("mouseleave", (e) => {
      if (!domElm.classList.contains("selectedTEI")) {
        domElm.classList.remove("selectableTEI");
      }
      e.stopPropagation();
    });
  };

  render() {
    /**
     * Handles language selection changes in the dropdown.
     * Updates the selected language in state and triggers content refresh.
     *
     * @param {object} event - The change event from the Select component.
     */
    const handleChange = (event) => {
      this.props.onLanguageChanged(event.target.value);
      this.setState({
        language: event.target.value,
        refreshKey: this.state.refreshKey + 1
      });
    };

    /**
     * Handles view mode changes between rendered and XML views.
     *
     * @param {object} event - The change event from the ToggleButtonGroup.
     * @param {string} newMode - The new view mode ('rendered' or 'xml').
     */
    const handleViewModeChange = (event, newMode) => {
      if (newMode !== null) {
        this.setState({ viewMode: newMode });
      }
    };

    return (
      <Box>
        <FormControl
          fullWidth
          disabled={
            data
              .getDocumentLanguages()
              .filter((language) => language !== this.props.excludeLanguage).length === 0
          }
        >
          <InputLabel id={this.props.id + "-label"}>Language</InputLabel>
          <Select
            labelId={this.props.id + "-label"}
            id={this.props.id + "-select"}
            value={this.state.language}
            label="Language"
            onChange={handleChange}
          >
            {data
              .getDocumentLanguages()
              .filter((language) => language !== this.props.excludeLanguage)
              .map((language) => (
                <MenuItem value={language} key={this.props.id + "-key-" + language}>
                  {language}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {/* View mode toggle */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={this.props.onTokenize}
              disabled={!this.props.hasSelection}
            >
              Tokenize selection
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={this.props.onTokenizeAll}
            >
              Tokenize all
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={this.props.onSelectAll}
            >
              Select all
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={this.props.onDeselectAll}
            >
              Deselect all
            </Button>
          </Box>

          <ToggleButtonGroup
            value={this.state.viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="rendered" aria-label="rendered view">
              <VisibilityIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="xml" aria-label="xml view">
              <CodeIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Unified viewer - shows/hides tags based on viewMode */}
        {this.state.language && (
          <InteractiveXMLViewer
            ref={this.viewerRef}
            key={this.state.refreshKey} // Force re-render when content changes
            xmlContent={data.getDocumentPerLanguage(this.state.language) || ""}
            showTags={this.state.viewMode === 'xml'}
            onElementInteraction={this.alignLogic}
          />
        )}
      </Box>
    );
  }
}

export default AlignTab;
