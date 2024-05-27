import React from 'react';

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import AlignTab from '../components/aligntab.js';

export default class EditorView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabASelections: [],
      tabBSelections: [],
    };
  }

  render() {
    return (
      <Box>
        <Typography variant="h3" gutterBottom>Align the translations</Typography>
        <Grid container spacing={2}>
          <Grid item xs={4.5}>
            <AlignTab id="tabA" onSelectionChanged={selections => this.setState({tabASelections: selections })} />
          </Grid>
          <Grid item xs={4.5}>
            <AlignTab id="tabB" onSelectionChanged={selections => this.setState({tabBSelections: selections })} />
          </Grid>
          <Grid item xs={3}>
             <Button variant="contained" disabled={!this.state.tabASelections.length || !this.state.tabBSelections.length}>Link selections</Button>
          </Grid>
        </Grid>
      </Box>
    );
  }
}
