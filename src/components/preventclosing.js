import * as React from "react";

import data from "../Data.js";

export default function PreventClosing() {
  window.onbeforeunload = () => data.isChanged;

  return <></>;
}
