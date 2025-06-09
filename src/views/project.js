import * as React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";

import Title from '../components/title.js';
import data from "../Data.js";

const fields = [
  { id: "title", name: "Project title", required: true },
  { id: "authors", name: "Authors", required: true, multiple: true },
  { id: "resps", name: "Responsible persons", multiple: true },
  { id: "pubStatement", name: "Publication Statement", multiline: true },
];

function ProjectView() {
  const [validForm, setValidForm] = React.useState(false);
  const [values, setValues] = React.useState({
    title: data.project.title || "",
    authors: Array.isArray(data.project.authors)
      ? data.project.authors
      : data.project.authors
      ? data.project.authors.split("\n")
      : [],
    resps: Array.isArray(data.project.resps)
      ? data.project.resps
      : data.project.resps
      ? data.project.resps.split("\n")
      : [],
    pubStatement: data.project.pubStatement || "",
  });

  const handleChange = (e, id) => {
    e.preventDefault();

    setValues((prev) => ({ ...prev, [id]: e.target.value }));
  };

  const handleMultiChange = (id, newValue) => {
    setValues((prev) => ({ ...prev, [id]: newValue }));
  };

  React.useEffect(() => {
    const isValid = fields.every((field) => {
      const val = values[field.id];
      if (!field.required) return true;
      if (field.multiple) return val && val.length > 0;
      return val !== "" && val !== undefined;
    });
    setValidForm(isValid);
  }, [values]);

  const handleClick = () => {
    data.project = values;
  };

  return (
    <Box component="form" noValidate>
      <Title title="Project base properties" />

      <Box id="project-fields">
        {fields.map((field, index) => (
          <Box key={index} component="span" display="block" gap={4} p={2}>
            {field.multiple ? (
              <Autocomplete
                multiple
                freeSolo
                value={values[field.id]}
                onChange={(e, newValue) => handleMultiChange(field.id, newValue)}
                options={[]}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={field.name}
                    required={field.required || false}
                  />
                )}
                sx={{ width: 500 }}
              />
            ) : (
              <TextField
                label={field.name}
                required={field.required || false}
                multiline={field.multiline || false}
                onChange={(e) => handleChange(e, field.id)}
                sx={{ width: 500 }}
                defaultValue={values[field.id] || ""}
              />
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        <div>
          <Button
            id="project-save"
            variant="contained"
            sx={{ mt: 1, mr: 1 }}
            disabled={!validForm}
            onClick={handleClick}
          >
            Save
          </Button>
        </div>
      </Box>
    </Box>
  );
}

const ProjectOnboarding = [
  {
    popover: {
      title: "Project section",
      description:
        "Insert the general metadata of your edition: title, authors, responsible persons and publication statement.",
    },
  },
  {
    element: "#project-fields",
    popover: {
      title: "Project fields",
      description:
        "Fill in these fields. Required ones are marked."
    },
  },
  {
    element: "#project-save",
    popover: {
      title: "Save project",
      description: "Store the metadata before moving to the next step.",
    },
  },
];

export { ProjectView, ProjectOnboarding };
