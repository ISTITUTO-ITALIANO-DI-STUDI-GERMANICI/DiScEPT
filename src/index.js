import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CookiesProvider } from "react-cookie";

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <CookiesProvider>
      <App />
    </CookiesProvider>
  </StrictMode>,
);
