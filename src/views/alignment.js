import React from "react";

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

import AlignTab from "../components/aligntab.js";

import data from "../Data.js";

class AlignmentView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabALanguage: "",
      tabASelections: [],
      tabBLanguage: "",
      tabBSelections: [],
      listRefreshNeeded: 0,
    };
  }

  render() {
    const tabAref = React.createRef();
    const tabBref = React.createRef();

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

    const showAligment = (index) => {
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
          .forEach((elm) => elm.classList.add("previewAligmentTEI"));
        obj.b
          .map((id) => document.getElementById(id))
          .filter((elm) => elm)
          .forEach((elm) => elm.classList.add("previewAligmentTEI"));
      });
    };

    const hideAligment = (index) => {
      Array.from(document.getElementsByClassName("previewAligmentTEI")).forEach(
        (elm) => elm.classList.remove("previewAligmentTEI"),
      );
    };

    return (
      <Box>
        <Typography variant="h3" gutterBottom>
          Align the translations
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4.5}>
            <AlignTab
              id="tabA"
              onLanguageChanged={(language) =>
                languageChanged("tabA", language)
              }
              onSelectionChanged={(domElm, teiElm, rootElm) =>
                updateSelection("tabA", domElm, teiElm, rootElm)
              }
              excludeLanguage={this.state.tabBLanguage}
            />
          </Grid>
          <Grid item xs={4.5}>
            <AlignTab
              id="tabB"
              onLanguageChanged={(language) =>
                languageChanged("tabB", language)
              }
              onSelectionChanged={(domElm, teiElm, rootElm) =>
                updateSelection("tabB", domElm, teiElm, rootElm)
              }
              excludeLanguage={this.state.tabALanguage}
            />
          </Grid>
          <Grid item xs={3}>
            <Button
              id="alignment-link"
              variant="contained"
              disabled={
                !this.state.tabASelections.length ||
                !this.state.tabBSelections.length
              }
              onClick={createLink}
            >
              Link selections
            </Button>
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
                        primary={"Alignment " + (index + 1)}
                        onMouseOut={() => hideAligment(index)}
                        onMouseOver={() => showAligment(index)}
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
