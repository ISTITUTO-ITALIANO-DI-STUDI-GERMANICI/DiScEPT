import React from "react";

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

import AlignTab from "../components/aligntab.js";
import AutomagicButton from "../components/automagicbutton.js";
import Title from "../components/title.js";

import data, { ALIGNMENT_CATEGORIES } from "../Data.js";

const TEI_NS = "http://www.tei-c.org/ns/1.0";

class AlignmentView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabALanguage: "",
      tabASelections: [],
      tabARefreshNeeded: 0,
      tabBLanguage: "",
      tabBSelections: [],
      tabBRefreshNeeded: 0,
      listRefreshNeeded: 0,
      category: ALIGNMENT_CATEGORIES[0],
    };
  }

  render() {
    const tabAref = React.createRef();
    const tabBref = React.createRef();

    const tokenizeLink = () => {
      if (this.state.tabASelections.length) {
        tokenize(true, this.state.tabALanguage, this.state.tabASelections);
      } else {
        tokenize(false, this.state.tabBLanguage, this.state.tabBSelections);
      }
    };

    const tokenizeArray = (parts) => {
      let whitespaces = [];
      let current = "";
      const values = [];

      function bestOf(whitespaces) {
        if (whitespaces.includes("\n")) return "\n";
        return " ";
      }

      for (const part of parts) {
        if (/\s/.test(part)) {
          whitespaces.push(part);
          continue;
        }

        if (current !== "") {
          values.push(current + bestOf(whitespaces));
        }

        current = part;
        whitespaces = [];
      }

      if (current !== "") {
        values.push(current + bestOf(whitespaces));
      }

      return values;
    };

    const tokenizeInternal = (elm) => {
      let changed = false;
      for (const node of Array.from(elm.childNodes)) {
        switch (node.nodeType) {
          case Node.ELEMENT_NODE: {
            if (tokenizeInternal(node)) {
              changed = true;
            }
            break;
          }

          case Node.TEXT_NODE: {
            const text = tokenizeArray(
              node.textContent.trim().split(/(?=\s)|(?<=\s)/g),
            );
            if (text.length <= 1) break;

            text.forEach((word) => {
              const elm = node.ownerDocument.createElementNS(TEI_NS, "w");
              elm.textContent = word;
              node.parentElement.insertBefore(elm, node);

              node.parentElement.insertBefore(
                node.ownerDocument.createTextNode(" "),
                node,
              );
            });

            node.remove();
            changed = true;
            break;
          }
        }
      }

      return changed;
    };

    const tokenize = (isA, language, selections) => {
      if (!selections.length) return;

      let changed = false;

      selections.forEach((selection) => {
        if (tokenizeInternal(selection.teiElm)) {
          changed = true;
        }
      });

      if (changed) {
        data.updateDocumentPerLanguage(
          language,
          selections[0].teiElm.ownerDocument.firstElementChild.outerHTML,
        );

        selections.forEach((a) => {
          a.domElm.classList.remove("selectedTEI");
          a.domElm.classList.remove("selectableTEI");
        });

        if (isA) {
          this.setState({
            tabARefreshNeeded: this.state.tabARefreshNeeded + 1,
            tabASelections: [],
          });
        } else {
          this.setState({
            tabBRefreshNeeded: this.state.tabBRefreshNeeded + 1,
            tabBSelections: [],
          });
        }
      }
    };

    const createLink = () => {
      const langAIds = [];
      const langBIds = [];

      for (const tab of [
        {
          language: this.state.tabALanguage,
          selection: this.state.tabASelections,
          ids: langAIds,
        },
        {
          language: this.state.tabBLanguage,
          selection: this.state.tabBSelections,
          ids: langBIds,
        },
      ]) {
        tab.selection.forEach((a) => {
          if (!a.domElm.hasAttribute("id")) {
            const uuid = crypto.randomUUID();
            a.domElm.setAttribute("id", uuid);
            a.teiElm.setAttribute("xml:id", uuid);

            data.updateDocumentPerLanguage(
              tab.language,
              tab.selection[0].teiElm.ownerDocument.firstElementChild.outerHTML,
            );
          }

          tab.ids.push(a.domElm.getAttribute("id"));
        });
      }

      data.addAlignment(
        this.state.tabALanguage,
        this.state.tabBLanguage,
        langAIds,
        langBIds,
        this.state.category,
      );

      for (const tab of [
        this.state.tabASelections,
        this.state.tabBSelections,
      ]) {
        tab.forEach((a) => {
          a.domElm.classList.remove("selectedTEI");
          a.domElm.classList.remove("selectableTEI");
        });
      }

      this.setState({ tabASelections: [], tabBSelections: [] });
    };

    const languageChanged = (id, language) => {
      const newState = {};
      newState[id === "tabA" ? "tabALanguage" : "tabBLanguage"] = language;
      this.setState(newState);
    };

    const updateSelection = (id, domElm, teiElm, rootElm) => {
      const obj =
        this.state[id === "tabA" ? "tabASelections" : "tabBSelections"];
      if (domElm.classList.contains("selectedTEI")) {
        obj.splice(
          obj.findIndex((a) => a.domElm === domElm),
          1,
        );
      } else {
        obj.push({ domElm, teiElm });
      }

      domElm.classList.toggle("selectedTEI");
      const newState = {};
      newState[id === "tabA" ? "tabASelections" : "tabBSelections"] = obj;
      this.setState(newState);
    };

    const deleteAlignment = (index) => {
      data.deleteAlignment(
        this.state.tabALanguage,
        this.state.tabBLanguage,
        index,
      );
      this.setState({ listRefreshNeeded: this.state.listRefreshNeeded + 1 });
    };

    const showAlignment = (index) => {
      const a = data.getAlignments(
        this.state.tabALanguage,
        this.state.tabBLanguage,
      );
      if (!a) {
        return;
      }

      a.forEach((obj) => {
        obj.a
          .map((id) => document.getElementById(id))
          .filter((elm) => elm)
          .forEach((elm) => elm.classList.add("previewAlignmentTEI"));
        obj.b
          .map((id) => document.getElementById(id))
          .filter((elm) => elm)
          .forEach((elm) => elm.classList.add("previewAlignmentTEI"));
      });
    };

    const hideAlignment = (index) => {
      Array.from(
        document.getElementsByClassName("previewAlignmentTEI"),
      ).forEach((elm) => elm.classList.remove("previewAlignmentTEI"));
    };

    const linkDisabled =
      !this.state.tabASelections.length || !this.state.tabBSelections.length;

    return (
      <Box>
        <Title title="Align the translations" />

        <Grid container spacing={2}>
          <Grid item xs={9}>
            <Box
              sx={{
                bgcolor: "background.paper",
                p: 2,
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <AlignTab
                    id="tabA"
                    onLanguageChanged={(language) =>
                      languageChanged("tabA", language)
                    }
                    onSelectionChanged={(domElm, teiElm, rootElm) =>
                      updateSelection("tabA", domElm, teiElm, rootElm)
                    }
                    excludeLanguage={this.state.tabBLanguage}
                    refreshNeeded={this.state.tabARefreshNeeded}
                  />
                </Grid>
                <Grid item xs={6}>
                  <AlignTab
                    id="tabB"
                    onLanguageChanged={(language) =>
                      languageChanged("tabB", language)
                    }
                    onSelectionChanged={(domElm, teiElm, rootElm) =>
                      updateSelection("tabB", domElm, teiElm, rootElm)
                    }
                    excludeLanguage={this.state.tabALanguage}
                    refreshNeeded={this.state.tabBRefreshNeeded}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  id="tokenize-link"
                  variant="contained"
                  disabled={
                    (!this.state.tabASelections.length &&
                      !this.state.tabBSelections.length) ||
                    (this.state.tabASelections.length &&
                      this.state.tabBSelections.length)
                  }
                  onClick={tokenizeLink}
                >
                  Tokenize selection
                </Button>
                <AutomagicButton
                  languageA={this.state.tabALanguage}
                  languageB={this.state.tabBLanguage}
                >
                  AI alignment
                </AutomagicButton>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  id="alignment-link"
                  variant="contained"
                  disabled={linkDisabled}
                  onClick={createLink}
                >
                  Link selections
                </Button>
                <FormControl disabled={linkDisabled} fullWidth>
                  <InputLabel id="category-select-label">Category</InputLabel>
                  <Select
                    labelId="category-select-label"
                    id="category-select"
                    value={this.state.category}
                    label="Category"
                    onChange={(e) =>
                      this.setState({ category: e.target.value })
                    }
                  >
                    {ALIGNMENT_CATEGORIES.map((cat) => (
                      <MenuItem value={cat} key={"cat-" + cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <List key={"list-" + this.state.listRefreshNeeded}>
              {data
                .getAlignments(this.state.tabALanguage, this.state.tabBLanguage)
                .map((alignment, index) => (
                  <ListItem
                    disablePadding
                    key={"list-alignment-" + index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => deleteAlignment(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton>
                      <ListItemText
                        primary={`Alignment ${index + 1} (${alignment.category})`}
                        onMouseOut={() => hideAlignment(index)}
                        onMouseOver={() => showAlignment(index)}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
            </List>
          </Grid>
        </Grid>
      </Box>
    );
  }
}

const AlignmentOnboarding = [
  {
    popover: {
      title: "Alignment section",
      description: "TODO",
    },
  },
  {
    element: "#tabA-select",
    popover: { title: "Pick a language", description: "TODO" },
  },
  {
    element: "#tabB-select",
    popover: { title: "Pick a language", description: "TODO" },
  },
  {
    element: "#alignment-link",
    popover: { title: "Create a link", description: "TODO" },
  },
];

export { AlignmentView, AlignmentOnboarding };
