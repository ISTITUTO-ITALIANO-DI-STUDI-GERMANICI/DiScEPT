import * as React from "react";

import Grid from "@mui/material/Grid";
import CssBaseline from "@mui/material/CssBaseline";
import { withCookies, Cookies } from "react-cookie";
import { instanceOf } from "prop-types";

import DisceptAppBar from "./components/appbar.js";
import DisceptStepper from "./components/stepper.js";
import DisceptFileUploader from "./components/fileuploader.js";
import Onboarding from "./components/onboarding.js";

import { IntroView, IntroOnboarding } from "./views/intro.js";
import { ProjectView, ProjectOnboarding } from "./views/project.js";
import { EditorView, EditorOnboarding } from "./views/editor.js";
import { AlignmentView, AlignmentOnboarding } from "./views/alignment.js";
import { ImageView, ImageOnboarding } from "./views/image.js";
import { FinalView, FinalOnboarding } from "./views/final.js";

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

class App extends React.Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired,
  };

  constructor(props) {
    super(props);

    const { cookies } = props;

    this.state = {
      currentStep: 0,
      fileUploaded: null,
      skipOnboarding: ("" + cookies.get("skipOnboarding") || "")
        .split(",")
        .map((value) => parseInt(value))
        .filter((value) => typeof value === "number" && isFinite(value)),
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
      this.setState({
        skipOnboarding: this.state.skipOnboarding.filter(
          (value) => value != this.state.currentStep,
        ),
      });
    };

    const onboardingCompleted = () => {
      const skipOnboarding = this.state.skipOnboarding.filter(
        (value) => value != this.state.currentStep,
      );
      skipOnboarding.push(this.state.currentStep);

      this.setState({ skipOnboarding });

      const { cookies } = this.props;
      cookies.set("skipOnboarding", skipOnboarding.join(","), {
        path: "/",
        sameSite: "lax",
        maxAge: 3600 * 24 * 1024,
      });
    };

    return (
      <React.Fragment>
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
          run={!this.state.skipOnboarding.includes(this.state.currentStep)}
          onCompleted={onboardingCompleted}
          steps={steps[this.state.currentStep].onboarding}
        />
      </React.Fragment>
    );
  }
}

export default withCookies(App);
