import * as React from "react"; // Import the React library
import Grid from "@mui/material/Grid"; // Import Grid component from Material-UI
import { ThemeProvider, CssBaseline } from '@mui/material';

// Custom components
import DisceptAppBar from "./components/appbar.js";
import DisceptStepper from "./components/stepper.js";
import DisceptFileUploader from "./components/fileuploader.js";
import Onboarding from "./components/onboarding.js";
import PreventClosing from "./components/preventclosing.js";
import Footer from "./components/footer.js";

// Views and their onboarding components
import { IntroView, IntroOnboarding } from "./views/intro.js";
import { ProjectView, ProjectOnboarding } from "./views/project.js";
import { EditorView, EditorOnboarding } from "./views/editor.js";
import { AlignmentView, AlignmentOnboarding } from "./views/alignment.js";
import { ImageView, ImageOnboarding } from "./views/image.js";
import { FinalView, FinalOnboarding } from "./views/final.js";
import theme from './Theme.js';

// Define steps of the app, each with a view component and an optional onboarding process
const steps = [
  {
    label: "Intro", // Step 1: Introduction
    description: "Read about this project!", // Step description
    component: IntroView, // Corresponding view component
    onboarding: IntroOnboarding, // Corresponding onboarding component
  },
  {
    label: "Project description", // Step 2: Project description
    description: "Describe your project, the team members, the authors, etc.",
    component: ProjectView,
    onboarding: ProjectOnboarding,
  },
  {
    label: "TEI and translations", // Step 3: TEI editor and translation management
    description:
      "Create or upload your TEI documents and define the translation sources.",
    component: EditorView,
    onboarding: EditorOnboarding,
  },
  {
    label: "Alignments", // Step 4: Manage alignments between TEI documents
    description: "Align your TEI documents.",
    component: AlignmentView,
    onboarding: AlignmentOnboarding,
  },
  {
    label: "Images", // Step 5: Add images to the TEI documents
    description: "Add image resources to your TEI documents.",
    component: ImageView,
    onboarding: ImageOnboarding,
  },
  {
    label: "Final steps", // Step 6: Final step, finalize digital edition
    description: "Create your digital edition.",
    component: FinalView,
    onboarding: FinalOnboarding,
  },
];

class App extends React.Component {
  constructor(props) {
    super(props);
    // Initial state: Step 0, no file uploaded, onboarding not running
    this.state = {
      currentStep: 0,
      fileUploaded: null,
      runOnboarding: false,
      stepperOpen: true,
    };
  }

  render() {
    // Functional component for rendering the view of the current step
    const Item = ({ step }) => {
      const Component = steps[step].component;
      return <Component />; // Render the view component for the current step
    };

    // Function to change the current step
    const changeStep = (id) => {
      this.setState({ currentStep: id });
    };

    // Function to set the uploaded file in the state
    const fileUploaded = (fileUploaded) => {
      this.setState({ fileUploaded });
    };

    // Function to start the onboarding process
    const runOnboarding = () => {
      this.setState({ runOnboarding: true });
    };

    // Function to toggle the visibility of the stepper
    const toggleStepper = () => {
      this.setState((state) => ({ stepperOpen: !state.stepperOpen }));
    };

    // Function to stop the onboarding process once it's completed
    const onboardingCompleted = () => {
      this.setState({ runOnboarding: false });
    };

    // Function to navigate back to the intro step
    const goToIntro = () => {
      changeStep(0);
    };

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />

        <DisceptAppBar
          fileUploaded={fileUploaded}
          onHelp={runOnboarding}
          onToggleStepper={toggleStepper}
          stepperOpen={this.state.stepperOpen}
          onIntro={goToIntro}
        />

        <Grid container spacing={2} sx={{ p: 3, position: "relative" }}>
          <Grid
            item
            sx={{
              width: this.state.stepperOpen ? 240 : 16,
              transition: "width 0.2s ease",
              mr: 3,
            }}
          >
            <DisceptStepper
              steps={steps}
              onChange={changeStep}
              onToggle={toggleStepper}
              open={this.state.stepperOpen}
            />
          </Grid>
          <Grid item xs>
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

        <Footer />
        <PreventClosing />
      </ThemeProvider>
    );
  }
}

export default App; // Export the main App component
