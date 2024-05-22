import * as React from "react";

import Grid from "@mui/material/Grid";
import CssBaseline from "@mui/material/CssBaseline";

import DisceptAppBar from "./components/appbar.js";
import DisceptStepper from "./components/stepper.js";

import ProjectView from "./views/project.js";
import EditorView from "./views/editor.js";
import AlignmentView from "./views/alignment.js";
import BuildView from "./views/build.js";

const steps = [
  {
    label: "Project description",
    description:
      "Describe your project, the team members, the authors, etc.",
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
    label: "Final steps",
    description: "Create your digital edition.",
    component: BuildView,
  },
];

export default class App extends React.Component {
  state = {
    currentStep: 0,
  };

  render() {
    const Item = ({ step }) => {
      const Component = steps[step].component;
      return <Component />;
    };

    return (
      <React.Fragment>
        <CssBaseline />

        <DisceptAppBar />

        <Grid container spacing={2} sx={{ p: 3 }}>
          <Grid item xs={2}>
            <DisceptStepper
              steps={steps}
              onChange={(id) => this.setState({ currentStep: id })}
            />
          </Grid>
          <Grid item xs={10}>
            <Item step={this.state.currentStep} />
          </Grid>
        </Grid>
      </React.Fragment>
    );
  }
}
