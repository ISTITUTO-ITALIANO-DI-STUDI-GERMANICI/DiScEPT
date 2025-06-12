import Data from "../src/Data";

test("generateTEI includes TEI root and teiHeader", () => {
  const xml = Data.generateTEI();
  expect(xml).toContain("<TEI");
  expect(xml).toContain("<teiHeader>");
});

test("alignment category added as join type", () => {
  Data.addAlignment("en", "de", ["a1", "a2"], ["b1", "b2"], "Semantic");
  const xml = Data.generateTEI();
  expect(xml).toMatch(/<join[^>]*type="Semantic"/);
});

test("setImages saves images and getImages retrieves them", () => {
  const img = {
    id: "img1",
    ids: ["a1"],
    url: "http://example.com/img.jpg",
    type: "URL",
  };
  Data.setImages("en", [img]);
  expect(Data.getImages("en")).toEqual([img]);
});
