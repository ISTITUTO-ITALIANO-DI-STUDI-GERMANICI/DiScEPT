import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import data from "../Data.js";
import CETEIHelper from "../CETEIHelper.js";

class AlignTab extends React.Component {
  constructor(props) {
    super(props);

    this.state = { language: "", lastRefresh: 0 };
    this.contentRef = React.createRef();
  }

  render() {
    const handleChange = (event) => {
      this.props.onLanguageChanged(event.target.value);
      this.setState({ language: event.target.value });
      refresh(event.target.value);
    };

    const alignLogic = (id, rootElm, domElm, teiElm) => {
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

        <div ref={this.contentRef} />
      </Box>
    );
  }
}

export default AlignTab;
