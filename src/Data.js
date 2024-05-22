const tei = (text,extra = null) => `
<TEI version="3.3.0" xmlns="http://www.tei-c.org/ns/1.0">
 <teiHeader>
  <fileDesc>
   <titleStmt>
    <title>${text}</title>
   </titleStmt>
   <publicationStmt>
    <p>${text}</p>
   </publicationStmt>
  </fileDesc>
 </teiHeader>
 <text>
  <body>
   ${extra || text}
  </body>
 </text>
</TEI>`;

class Data {
  project = {}

  documents = []
};

const i = new Data();
export default i;
