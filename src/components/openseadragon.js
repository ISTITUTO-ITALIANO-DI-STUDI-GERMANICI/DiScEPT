import React, { useEffect } from "react";
import OpenSeadragon from "openseadragon";

function OpenSeaDragon({ url, type }) {
  useEffect(() => {
    let tileSources;

    if (!url || !type) {
      return;
    }

    if (type === "IIIF") {
      tileSources = {
        "@context": "http://iiif.io/api/image/2/context.json",
        "@id": url,
        height: 7200,
        width: 5233,
        profile: ["http://iiif.io/api/image/2/level2.json"],
        protocol: "http://iiif.io/api/image",
      };
    } else {
      tileSources = {
        type: "image",
        url: url,
      };
    }

    let viewer = OpenSeadragon({
      id: "seadragon-viewer",
      showHomeControl: false,
      navigatorPosition: "TOP_LEFT",
      showNavigationControl: true,
      navigationControlAnchor: OpenSeadragon.ControlAnchor.TOP_RIGHT,
      showZoomControl: false,
      prefixUrl: "//openseadragon.github.io/openseadragon/images/",
      tileSources,
    });

    return () => {
      viewer.destroy();
      viewer = null;
    };
  }, [url, type]);

  return <div id="seadragon-viewer" style={{ height: "300px" }} />;
}

export default OpenSeaDragon;
