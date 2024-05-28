class Data {
  #changed = false;
  #project = {};
  #documents = {
    it: `<TEI version="3.3.0" xmlns="http://www.tei-c.org/ns/1.0">
 <teiHeader>
  <fileDesc>
   <titleStmt>
    <title>TEST</title>
   </titleStmt>
   <publicationStmt>
    <p>A</p>
   </publicationStmt>
  </fileDesc>
 </teiHeader>
 <text>
  <body><p>Something</p>
  </body>
 </text>
</TEI>`,
  };

  #alignments = [];

  static ERR_INVALID_TYPE = "invalid";
  static ERR_NO_DISCEPT = "no-discept";

  get project() {
    return this.#project;
  }

  set project(data) {
    this.#changed = true;
    this.#project = data;
  }

  get isChanged() {
    return this.#changed;
  }

  getDocumentLanguages() {
    return Object.keys(this.#documents);
  }

  getDocumentPerLanguage(language) {
    return this.#documents[language] || "";
  }

  addDocumentPerLanguage(language, body) {
    this.#documents[language] = body;
    this.#changed = true;
  }

  async addFileDocumentPerLanguage(language, file) {
    this.addDocumentPerLanguage(language, await file.text());
  }

  deleteDocumentPerLanguage(deletingLanguage) {
    delete this.#documents[deletingLanguage];
    this.#changed = true;
  }

  updateDocumentPerLanguage(language, value) {
    this.#documents[language] = value;
    this.#changed = true;
  }

  #getAlignments(langA, langB) {
    let a = this.#alignments.find(
      (a) => a.langA === langA && a.langB === langB,
    );
    if (a) {
      return { aligments: a.aligments, swap: false };
    }

    a = this.#alignments.find((a) => a.langA === langB && a.langB === langA);
    if (a) {
      return { aligments: a.aligments, swap: true };
    }

    return null;
  }

  getAlignments(langA, langB) {
    const a = this.#getAlignments(langA, langB);
    if (!a) return [];

    if (!a.swap) return a.aligments;

    return a.aligments.map((obj) => ({ a: obj.b, b: obj.a }));
  }

  deleteAlignment(langA, langB, index) {
    const a = this.#getAlignments(langA, langB);
    if (!a) {
      return;
    }

    a.aligments.splice(index, 1);
    this.#changed = true;
  }

  addAlignment(langA, langB, idsA, idsB) {
    const a = this.#getAlignments(langA, langB);
    if (!a) {
      this.#alignments.push({
        langA,
        langB,
        aligments: [{ a: idsA, b: idsB }],
      });
      return;
    }

    this.#changed = false;

    if (!a.swap) {
      a.aligments.push({ a: idsA, b: idsB });
      return;
    }

    a.aligments.push({ a: idsB, b: idsA });
  }

  async readFromFile(file) {
    // TODO: extract the project details
    // TODO: extract the languages
    // TODO: return an error in case the format is incompatible.

    throw new Error(Data.ERR_NO_DISCEPT);

    this.#changed = false;
  }

  generateTEI() {
    // TODO: authors, resp...
    // TODO: aligments

    return `<TEI version="3.3.0" xmlns="http://www.tei-c.org/ns/1.0">
 <teiHeader>
  <fileDesc>
   <titleStmt>
    <title>${this.#project.title || ""}</title>
   </titleStmt>
   <publicationStmt>
    <p>${this.#project.pubStatement || ""}</p>
   </publicationStmt>
  </fileDesc>
 </teiHeader>
 ${Object.entries(this.#documents)
   .map((entry) => entry[1])
   .join("")}
</TEI>`;
  }
}

const i = new Data();
export default i;
