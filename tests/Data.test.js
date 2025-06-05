import Data from '../src/Data';

test('generateTEI includes TEI root and teiHeader', () => {
  const xml = Data.generateTEI();
  expect(xml).toContain('<TEI');
  expect(xml).toContain('<teiHeader>');
});
