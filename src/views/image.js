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
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";

import AlignTab from "../components/aligntab.js";
import OpenSeaDragon from "../components/openseadragon.js";

import data from "../Data.js";

class ImageView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      language: "",
      selections: [],
      listRefreshNeeded: 0,
      imageURL: "",
      imageURLInvalid: false,
      imageType: "",
    };
  }

  render() {
    const tabRef = React.createRef();

    const createLink = () => {
      const ids = [];

      this.state.selections.forEach((a) => {
        if (!a.domElm.hasAttribute("id")) {
          const uuid = crypto.randomUUID();
          a.domElm.setAttribute("id", uuid);
          a.teiElm.setAttribute("xml:id", uuid);

          data.updateDocumentPerLanguage(
            this.state.language,
            this.state.selections[0].teiElm.ownerDocument.firstElementChild
              .outerHTML,
          );
        }

        ids.push(a.domElm.getAttribute("id"));
      });

      data.addImage(
        this.state.language,
        crypto.randomUUID(),
        ids,
        this.state.imageURL,
        this.state.imageType,
      );

      this.state.selections.forEach((a) => {
        a.domElm.classList.remove("selectedTEI");
        a.domElm.classList.remove("selectableTEI");
      });

      this.setState({ selections: [], imageURL: "", imageType: "" });
    };

    const languageChanged = (language) => {
      this.setState({ language });
    };

    const updateSelection = (domElm, teiElm, rootElm) => {
      if (domElm.classList.contains("selectedTEI")) {
        this.state.selections.splice(
          this.state.selections.findIndex((a) => a.domElm === domElm),
          1,
        );
      } else {
        this.state.selections.push({ domElm, teiElm });
      }

      domElm.classList.toggle("selectedTEI");
      this.setState({ selections: this.state.selections });
    };

    const deleteImage = (index) => {
      data.deleteImage(this.state.language, index);
      this.setState({ listRefreshNeeded: this.state.listRefreshNeeded + 1 });
    };

    const showImage = (index) => {
      const a = data.getImages(this.state.language);
      if (!a) {
        return;
      }

      a.forEach((obj) => {
        obj.ids
          .map((id) => document.getElementById(id))
          .filter((elm) => elm)
          .forEach((elm) => elm.classList.add("previewAligmentTEI"));
      });
    };

    const hideImage = (index) => {
      Array.from(document.getElementsByClassName("previewAligmentTEI")).forEach(
        (elm) => elm.classList.remove("previewAligmentTEI"),
      );
    };

    const handleURLChange = (e) => {
      this.setState({
        imageURLInvalid: !e.target.checkValidity(),
        imageURL: e.target.value,
      });
    };

    const handleImageTypeChange = (e) => {
      this.setState({ imageType: e.target.value });
    };

    return (
      <Box>
        <Typography variant="h3" gutterBottom>
          Manage images
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={9}>
            <AlignTab
              id="tab"
              onLanguageChanged={languageChanged}
              onSelectionChanged={updateSelection}
            />
          </Grid>
          <Grid item xs={3}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                id="type-select"
                value={this.state.imageType}
                label="Type"
                onChange={handleImageTypeChange}
              >
                <MenuItem value="IIIF">IIIF endpoint</MenuItem>
                <MenuItem value="URL">URL</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="URL"
              required={true}
              multiline={false}
              type="url"
              id="imageURL"
              onChange={handleURLChange}
              value={this.state.imageURL}
              sx={{ mt: 2, mb: 2 }}
              error={this.state.imageURLInvalid}
            />

            <OpenSeaDragon
              type={this.state.imageType}
              url={this.state.imageURLInvalid ? null : this.state.imageURL}
            />

            <Button
              id="create-image"
              variant="contained"
              disabled={!this.state.selections.length || !this.state.imageURL}
              onClick={createLink}
              sx={{ mt: 2 }}
            >
              Create image
            </Button>
            <List key={"list-" + this.state.listRefreshNeeded}>
              {data.getImages(this.state.language).map((image, index) => (
                <ListItem
                  disablePadding
                  key={"list-image-" + index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => deleteImage(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton>
                    <ListItemText
                      primary={
                        "Image " +
                        (index + 1 + ": " + image.url + " (" + image.type + ")")
                      }
                      onMouseOut={() => hideImage(index)}
                      onMouseOver={() => showImage(index)}
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

const ImageOnboarding = [
  {
    popover: {
      title: "Image section",
      description: "TODO",
    },
  },
  {
    element: "#tab-select",
    popover: { title: "Pick a language", description: "TODO" },
  },
  {
    element: "#type-select",
    popover: { title: "Select an image type", description: "TODO" },
  },
  {
    element: "#imageURL",
    popover: { title: "Add an imageURL", description: "TODO" },
  },
  {
    element: "#create-image",
    popover: { title: "Save the image", description: "TODO" },
  },
];

export { ImageView, ImageOnboarding };
