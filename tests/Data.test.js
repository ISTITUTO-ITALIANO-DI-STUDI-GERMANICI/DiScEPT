import Data from '../src/Data';

test('generateTEI includes TEI root and teiHeader', () => {
  const xml = Data.generateTEI();
  expect(xml).toContain('<TEI');
  expect(xml).toContain('<teiHeader>');
});

test('alignment category added as join type', () => {
  Data.addAlignment('en', 'de', ['a1', 'a2'], ['b1', 'b2'], 'Semantic');
  const xml = Data.generateTEI();
  expect(xml).toMatch(/<join[^>]*type="Semantic"/);
});
