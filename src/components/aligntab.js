import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";

import data from "../Data.js";
import CETEIHelper from "../CETEIHelper.js";

/**
 * AlignTab component provides a user interface for selecting a language,
 * displaying language-specific content, and enabling user interactions
 * with TEI (Text Encoding Initiative) elements.
 */
class AlignTab extends React.Component {
  constructor(props) {
    super(props);

    // Initial state includes selected language and refresh tracking
    this.state = { language: "", lastRefresh: 0 };
    // Reference to content container for dynamic updates
    this.contentRef = React.createRef();
  }

  render() {
    /**
     * Handles language selection changes in the dropdown.
     * Updates the selected language in state and triggers content refresh.
     *
     * @param {object} event - The change event from the Select component.
     */
    const handleChange = (event) => {
      this.props.onLanguageChanged(event.target.value);
      this.setState({ language: event.target.value });
      refresh(event.target.value);
    };

    /**
     * Configures interactive logic for a TEI element.
     * Sets click and hover events to change the appearance and behavior of TEI elements.
     *
     * @param {string} id - The unique identifier for the element.
     * @param {HTMLElement} rootElm - The root element of the content.
     * @param {HTMLElement} domElm - The DOM element being configured.
     * @param {HTMLElement} teiElm - The TEI element related to domElm.
     */
    const alignLogic = (id, rootElm, domElm, teiElm) => {
      domElm.__teiElm = teiElm;
      domElm.addEventListener("click", (e) => {
        this.props.onSelectionChanged(domElm, teiElm, rootElm);
        e.stopPropagation();
      });

      domElm.addEventListener("mouseover", (e) => {
        if (!e.target.classList.contains("selectedTEI")) {
          e.target.classList.add("selectableTEI");
        }
        e.stopPropagation();
      });

      domElm.addEventListener("mouseout", (e) => {
        if (!e.target.classList.contains("selectedTEI")) {
          e.target.classList.remove("selectableTEI");
        }
        e.stopPropagation();
      });
    };

    /**
     * Refreshes the content based on the selected language.
     * Clears existing content and re-generates it using CETEIHelper, with
     * alignment logic applied to TEI elements.
     *
     * @param {string} language - The language code to load content for.
     */
    const refresh = (language) => {
      this.contentRef.current.innerHTML = "";
      this.contentRef.current.append(
        CETEIHelper.CETEI.makeHTML5(
          data.getDocumentPerLanguage(language),
          null,
          (domElm, teiElm) =>
            alignLogic(this.props.id, this.contentRef.current, domElm, teiElm),
        ),
      );
    };

    // Check if a refresh is needed based on props and state
    if (
      this.props.refreshNeeded != this.state.lastRefresh &&
      this.contentRef.current
    ) {
      this.setState({ lastRefresh: this.props.refreshNeeded });
      refresh(this.state.language);
    }

    return (
      <Box>
        <FormControl
          fullWidth
          disabled={
            data
              .getDocumentLanguages()
              .filter((language) => language !== this.props.excludeLanguage)
              .length === 0
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
                <MenuItem
                  value={language}
                  key={this.props.id + "-key-" + language}
                >
                  {language}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", gap: 1, my: 1 }}>
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

        {/* Content container for dynamic TEI elements */}
        <div ref={this.contentRef} />
      </Box>
    );
  }
}

export default AlignTab;
