import * as React from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Grid from "@mui/material/Grid";

import Title from '../components/title.js';
import data from "../Data.js";

// Organized field groups for better UX
const fieldGroups = [
  {
    title: "Basic Information",
    expanded: true,
    fields: [
      { id: "title", name: "Project Title", required: true, help: "Main title of your edition" },
      { id: "subtitle", name: "Subtitle", help: "Secondary title or subtitle" },
      { id: "authors", name: "Authors", required: true, multiple: true, help: "Press Enter to add multiple authors" },
      { id: "editors", name: "Editors", multiple: true, help: "Editors of this edition" },
      { id: "resps", name: "Other Contributors", multiple: true, help: "Other responsible persons (translators, encoders, etc.)" },
    ]
  },
  {
    title: "Publication Details",
    fields: [
      { id: "publisher", name: "Publisher", help: "Organization or person publishing this edition" },
      { id: "pubPlace", name: "Publication Place", help: "Location of publication" },
      { id: "pubDate", name: "Publication Date", help: "Date of publication (YYYY-MM-DD or YYYY)" },
      { id: "edition", name: "Edition", help: "Edition number or description (e.g., 'First digital edition')" },
      { id: "series", name: "Series", help: "Name of the series this edition belongs to" },
      { id: "availability", name: "Availability/License", multiline: true, help: "License information (e.g., CC BY 4.0)" },
      { id: "pubStatement", name: "Publication Statement", multiline: true, help: "Additional publication information" },
    ]
  },
  {
    title: "Content Description",
    fields: [
      { id: "abstract", name: "Abstract", multiline: true, rows: 4, help: "Brief summary of the edition content" },
      { id: "keywords", name: "Keywords", multiple: true, help: "Keywords for discoverability (press Enter to add)" },
      { id: "classification", name: "Classification", help: "Genre, text type, or classification" },
      { id: "extent", name: "Extent", help: "Size description (e.g., '250 pages', '50,000 words')" },
    ]
  },
  {
    title: "Source & Encoding",
    fields: [
      { id: "sourceDesc", name: "Source Description", multiline: true, rows: 3, help: "Description of the source text(s)" },
      { id: "originalLang", name: "Original Language", help: "Language of the original text" },
      { id: "encodingDesc", name: "Encoding Description", multiline: true, rows: 3, help: "Description of the encoding principles" },
      { id: "projectDesc", name: "Project Description", multiline: true, rows: 3, help: "Description of the editorial project" },
    ]
  },
  {
    title: "Funding & Support",
    fields: [
      { id: "funding", name: "Funding", multiline: true, help: "Information about funding sources" },
      { id: "sponsor", name: "Sponsor", help: "Sponsoring organization" },
      { id: "funder", name: "Funder", multiple: true, help: "Funding organizations" },
    ]
  }
];

function ProjectView() {
  const [validForm, setValidForm] = React.useState(false);

  // Initialize values from data
  const initValues = () => {
    const vals = {};
    fieldGroups.forEach(group => {
      group.fields.forEach(field => {
        const dataValue = data.project[field.id];
        if (field.multiple) {
          vals[field.id] = Array.isArray(dataValue)
            ? dataValue
            : dataValue ? dataValue.split("\n") : [];
        } else {
          vals[field.id] = dataValue || "";
        }
      });
    });
    return vals;
  };

  const [values, setValues] = React.useState(initValues());

  const handleChange = (e, id) => {
    e.preventDefault();
    setValues((prev) => ({ ...prev, [id]: e.target.value }));
  };

  const handleMultiChange = (id, newValue) => {
    setValues((prev) => ({ ...prev, [id]: newValue }));
  };

  // Validate required fields
  React.useEffect(() => {
    const requiredFields = [];
    fieldGroups.forEach(group => {
      group.fields.forEach(field => {
        if (field.required) requiredFields.push(field);
      });
    });

    const isValid = requiredFields.every((field) => {
      const val = values[field.id];
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
      <Title title="Project Metadata" />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Complete the TEI header information for your scholarly edition. Required fields are marked with *.
      </Typography>

      <Box id="project-fields">
        {fieldGroups.map((group, groupIndex) => (
          <Accordion
            key={groupIndex}
            defaultExpanded={group.expanded || false}
            sx={{ mb: 1 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${groupIndex}-content`}
              id={`panel${groupIndex}-header`}
            >
              <Typography sx={{ fontWeight: 500 }}>{group.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {group.fields.map((field, fieldIndex) => (
                  <Grid item xs={12} key={fieldIndex}>
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
                              key={index}
                            />
                          ))
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={field.name}
                            required={field.required || false}
                            helperText={field.help}
                          />
                        )}
                        fullWidth
                      />
                    ) : (
                      <TextField
                        label={field.name}
                        required={field.required || false}
                        multiline={field.multiline || false}
                        rows={field.rows || 2}
                        onChange={(e) => handleChange(e, field.id)}
                        helperText={field.help}
                        fullWidth
                        defaultValue={values[field.id] || ""}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box sx={{ mt: 3, mb: 2 }}>
        <Button
          id="project-save"
          variant="contained"
          sx={{ mt: 1, mr: 1 }}
          disabled={!validForm}
          onClick={handleClick}
        >
          Save Metadata
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          {validForm ? "All required fields completed" : "Please fill all required fields (marked with *)"}
        </Typography>
      </Box>
    </Box>
  );
}

const ProjectOnboarding = [
  {
    popover: {
      title: "Project Metadata",
      description:
        "Complete the TEI header information for your scholarly edition. The form is organized in expandable sections.",
    },
  },
  {
    element: "#project-fields",
    popover: {
      title: "Metadata Fields",
      description:
        "Fill in the metadata fields. Click on each section to expand and view more fields. Required fields are marked with *."
    },
  },
  {
    element: "#project-save",
    popover: {
      title: "Save Metadata",
      description: "Save all metadata to the TEI header before moving to the next step.",
    },
  },
];

export { ProjectView, ProjectOnboarding };
