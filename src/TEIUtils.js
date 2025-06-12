export const TEI_NS = "http://www.tei-c.org/ns/1.0";

export async function parseTEIFile(file) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(await file.text(), "text/xml");

  if (
    !dom.firstElementChild ||
    dom.firstElementChild.tagName !== "TEI" ||
    dom.firstElementChild.namespaceURI !== TEI_NS
  ) {
    throw new Error("invalid");
  }

  const hasText = Array.from(dom.firstElementChild.children).some(
    (a) => a.tagName === "text",
  );

  return { dom, isDiscept: !hasText };
}

export function parseTEIString(text) {
  const parser = new DOMParser();
  const dom = parser.parseFromString(text, "text/xml");

  if (
    !dom.firstElementChild ||
    dom.firstElementChild.tagName !== "TEI" ||
    dom.firstElementChild.namespaceURI !== TEI_NS
  ) {
    throw new Error("invalid");
  }

  const hasText = Array.from(dom.firstElementChild.children).some(
    (a) => a.tagName === "text",
  );

  return { dom, isDiscept: !hasText };
}
