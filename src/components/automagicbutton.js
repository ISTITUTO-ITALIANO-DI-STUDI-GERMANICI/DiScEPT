import * as React from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import data from "../Data.js";
import CETEIHelper from "../CETEIHelper.js";

const MAGIC_URL = "http://localhost:5000/align";

export default function AutomagicButton({ languageA, languageB }) {
  const [loading, setLoading] = React.useState(false);

  const click = async () => {
    const obj = { a: null, b: null };

    const a = CETEIHelper.CETEI.makeHTML5(
      data.getDocumentPerLanguage(languageA),
      null,
      (domElm, teiElm) => (obj.a = { domElm, teiElm }),
    )
      .getElementsByTagName("tei-body")[0]
      .textContent.trim();
    const b = CETEIHelper.CETEI.makeHTML5(
      data.getDocumentPerLanguage(languageB),
      null,
      (domElm, teiElm) => (obj.b = { domElm, teiElm }),
    )
      .getElementsByTagName("tei-body")[0]
      .textContent.trim();

    setLoading(true);

    const response = await fetch(MAGIC_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ a, b }),
    }).then(
      (r) => r.json(),
      () => setLoading(false),
    );

    if (!response) return;

    for (const align of response) {
      console.log(align);
    }

    setLoading(false);
  };

  const Content = ({ loading }) => {
    if (loading) return <CircularProgress size="24px" />;
    return <div>Auto Alignment (AI)</div>;
  };

  return (
    <Button
      variant="contained"
      disabled={loading || languageA === "" || languageB === ""}
      onClick={click}
    >
      <Content loading={loading} />
    </Button>
  );
}
