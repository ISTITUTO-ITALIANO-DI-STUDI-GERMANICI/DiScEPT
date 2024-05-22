import * as React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';

const oddList = [
  "AA", "BB", "CC"
];

const pageList = [
  "Two-column view", "Three-column view", "Grid view"
];

export default function AlignmentView() {
  const [odd, setOdd] = React.useState('');
  const [pageTemplate, setPageTemplate] = React.useState('');

  const handleClick = () => {
    // TODO: build!
  };

  return (
    <Box component="form" noValidate>
      <Box component="span" display="block" gap={4} p={2}>
        <FormControl fullWidth>
          <InputLabel id="select-odd-label">TEI Publisher ODD</InputLabel>
          <Select
            label="TEI Publisher ODD"
            labelId="select-odd-label"
            id="select-odd"
            value={odd}
            onChange={event => setOdd(event.target.value)}
  >
            {oddList.map((value, index) => (
              <MenuItem value={value} key={index}>{value}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box component="span" display="block" gap={4} p={2}>
        <FormControl fullWidth>
          <InputLabel id="select-page-label">TEI Publisher ODD</InputLabel>
          <Select
            label="TEI Publisher ODD"
            labelId="select-page-label"
            id="select-page"
            value={pageTemplate}
            onChange={event => setPageTemplate(event.target.value)}
  >
            {pageList.map((value, index) => (
              <MenuItem value={value} key={index}>{value}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 2 }}>
        <div>
          <Button variant="contained" sx={{ mt: 1, mr: 1 }} onClick={handleClick}>
            Build!
          </Button>
        </div>
      </Box>
    </Box>
  );
}
