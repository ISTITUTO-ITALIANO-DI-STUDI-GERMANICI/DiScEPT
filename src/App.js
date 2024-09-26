import * as React from "react";

import Grid from "@mui/material/Grid";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from '@mui/material/styles';

import DisceptAppBar from "./components/appbar.js";
import DisceptStepper from "./components/stepper.js";
import DisceptFileUploader from "./components/fileuploader.js";
import Onboarding from "./components/onboarding.js";
import PreventClosing from "./components/preventclosing.js";

import { IntroView, IntroOnboarding } from "./views/intro.js";
import { ProjectView, ProjectOnboarding } from "./views/project.js";
import { EditorView, EditorOnboarding } from "./views/editor.js";
import { AlignmentView, AlignmentOnboarding } from "./views/alignment.js";
import { ImageView, ImageOnboarding } from "./views/image.js";
import { FinalView, FinalOnboarding } from "./views/final.js";
import { themeOptions } from "./Theme.js"

const steps = [
  {
    label: "Intro",
    description: "Read about this project!",
    component: IntroView,
    onboarding: IntroOnboarding,
  },
  {
    label: "Project description",
    description: "Describe your project, the team members, the authors, etc.",
    component: ProjectView,
    onboarding: ProjectOnboarding,
  },
  {
    label: "TEI and translations",
    description:
      "Create or upload your TEI documents and define the translation sources.",
    component: EditorView,
    onboarding: EditorOnboarding,
  },
  {
    label: "Alignments",
    description: "Align your TEI documents.",
    component: AlignmentView,
    onboarding: AlignmentOnboarding,
  },
  {
    label: "Images",
    description: "Add image resources to your TEI documents.",
    component: ImageView,
    onboarding: ImageOnboarding,
  },
  {
    label: "Final steps",
    description: "Create your digital edition.",
    component: FinalView,
    onboarding: FinalOnboarding,
  },
];

const theme = createTheme(themeOptions);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
      fileUploaded: null,
      runOnboarding: false,
    };
  }

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

    const runOnboarding = () => {
      this.setState({ runOnboarding: true });
    };

    const onboardingCompleted = () => {
      this.setState({ runOnboarding: false });
    };

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <DisceptAppBar fileUploaded={fileUploaded} onHelp={runOnboarding} />

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

        <Onboarding
          run={this.state.runOnboarding}
          onCompleted={onboardingCompleted}
          steps={steps[this.state.currentStep].onboarding}
        />

        <PreventClosing />
      </ThemeProvider>
    );
  }
}

export default App;
