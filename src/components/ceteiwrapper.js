import * as React from "react";

export default function CETEIWrapper({tei}) {
  const initRef = React.useRef(new CETEI());
  const teiRef = React.useRef("");

  const [content, setContent] = React.useState("");

  if (teiRef.current !== tei) {
    teiRef.current = tei;
    initRef.current.makeHTML5(tei, data => setContent(data.outerHTML));
  }

  return  <div dangerouslySetInnerHTML={{ __html: content }} />
}
