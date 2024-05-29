import * as React from "react";

import Grid from "@mui/material/Grid";
import CssBaseline from "@mui/material/CssBaseline";

import DisceptAppBar from "./components/appbar.js";
import DisceptStepper from "./components/stepper.js";
import DisceptFileUploader from "./components/fileuploader.js";

import IntroView from "./views/intro.js";
import ProjectView from "./views/project.js";
import EditorView from "./views/editor.js";
import AlignmentView from "./views/alignment.js";
import ImageView from "./views/image.js";
import FinalView from "./views/final.js";

const steps = [
  {
    label: "Intro",
    description: "Read about this project!",
    component: IntroView,
  },
  {
    label: "Project description",
    description: "Describe your project, the team members, the authors, etc.",
    component: ProjectView,
  },
  {
    label: "TEI and translations",
    description:
      "Create or upload your TEI documents and define the translation sources.",
    component: EditorView,
  },
  {
    label: "Alignments",
    description: "Align your TEI documents.",
    component: AlignmentView,
  },
  {
    label: "Images",
    description: "Add image resources to your TEI documents.",
    component: ImageView,
  },
  {
    label: "Final steps",
    description: "Create your digital edition.",
    component: FinalView,
  },
];

export default class App extends React.Component {
  state = {
    currentStep: 0,
    fileUploaded: null,
  };

  render() {
    const Item = ({ step }) => {
      const Component = steps[step].component;
      return <Component />;
    };

    const changeStep = (id) => {
      this.setState({ currentStep: id });
    };

    const fileUploaded = (fileUploaded) => {
      this.setState({ fileUploaded });
    };

    return (
      <React.Fragment>
        <CssBaseline />

        <DisceptAppBar fileUploaded={fileUploaded} />

        <Grid container spacing={2} sx={{ p: 3 }}>
          <Grid item xs={2}>
            <DisceptStepper steps={steps} onChange={changeStep} />
          </Grid>
          <Grid item xs={10}>
            <Item step={this.state.currentStep} />
          </Grid>
        </Grid>

        <DisceptFileUploader
          fileUploaded={this.state.fileUploaded}
          onChange={() => changeStep(0)}
        />
      </React.Fragment>
    );
  }
}
