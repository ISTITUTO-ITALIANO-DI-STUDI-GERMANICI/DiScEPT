import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import data from "../Data.js";
import CETEIHelper from "../CETEIHelper.js";

export default function AlignTab({
  id,
  onLanguageChanged,
  onSelectionChanged,
}) {
  const [language, setLanguage] = React.useState("");
  const contentRef = React.createRef();

  const handleChange = (event) => {
    onLanguageChanged(event.target.value);
    setLanguage(event.target.value);

    contentRef.current.innerHTML = "";
    contentRef.current.append(
      CETEIHelper.CETEI.makeHTML5(
        data.getDocumentPerLanguage(event.target.value),
        null,
        (domElm, teiElm) => alignLogic(id, contentRef.current, domElm, teiElm),
      ),
    );
  };

  const alignLogic = (id, rootElm, domElm, teiElm) => {
    domElm.addEventListener("click", (e) => {
      onSelectionChanged(domElm, teiElm, rootElm);
      e.stopPropagation();
    });

    domElm.addEventListener("mouseover", (e) => {
      if (!e.target.classList.contains("selectedTEI")) {
        e.target.classList.add("selectableTEI");
      }
      e.stopPropagation();
    });

    domElm.addEventListener("mouseout", (e) => {
      if (!e.target.classList.contains("selectedTEI")) {
        e.target.classList.remove("selectableTEI");
      }
      e.stopPropagation();
    });
  };

  return (
    <Box>
      <FormControl fullWidth>
        <InputLabel id={id + "-label"}>Language</InputLabel>
        <Select
          labelId={id + "-label"}
          id={id + "-select"}
          value={language}
          label="Language"
          onChange={handleChange}
        >
          {data.getDocumentLanguages().map((language) => (
            <MenuItem value={language} key={id + "-key-" + language}>
              {language}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <div ref={contentRef} />
    </Box>
  );
}
