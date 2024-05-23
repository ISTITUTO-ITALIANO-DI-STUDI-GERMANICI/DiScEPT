import * as React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import data from '../Data.js';

const fields = [
  { id: "title", name: "Project title", required: true },
  { id: "authors", name: "Authors (one per line)", required: true, multiline: true },
  { id: "resps", name: "Resps (one per line)", required: false, multiline: true },
  { id: "pubStatement", name: "Publication Statement", required: false, multiline: true },
];

export default function ProjectView() {
  const [validForm, setValidForm] = React.useState(false);
  const [values, setValues] = React.useState(data.project);

  const handleChange = (e, id) => {
    e.preventDefault();
    const validity = document.forms[0].checkValidity();
    setValidForm(validity);

    values[id] = e.target.value;
    setValues(values);
  };

  const handleClick = () => {
    data.project = values;
  };

  return (
    <Box component="form" noValidate>
      <Typography variant="h3" gutterBottom>Project base properties</Typography>

      {fields.map((field, index) => (
        <Box key={index} component="span" display="block" gap={4} p={2}>
          <TextField
            label={field.name}
            required={field.required || false}
            multiline={field.multiline || false}
            onChange={e => handleChange(e, field.id)}
            sx={{ width: 500 }}
            defaultValue={values[field.id] || ""}
          />
        </Box>
      ))}
      <Box sx={{ mb: 2 }}>
        <div>
          <Button variant="contained" sx={{ mt: 1, mr: 1 }} disabled={!validForm} onClick={handleClick}>
            Save 
          </Button>
        </div>
      </Box>
    </Box>
  );
}
