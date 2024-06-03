class Data {
  #changed = false;
  #project = {};
  #documents = {};
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
    if (!this.#documents[language]) {
      return "";
    }

    return this.#documents[language].document || "";
  }

  addDocumentPerLanguage(language, body) {
    if (!this.#documents[language]) {
      this.#documents[language] = {};
    }

    this.#documents[language].document = body;
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
    this.#documents[language].document = value;
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

  getImages(language) {
    if (!this.#documents[language]) {
      return [];
    }

    return this.#documents[language].images || [];
  }

  addImage(language, id, ids, url, type) {
    if (!this.#documents[language].images) {
      this.#documents[language].images = [];
    }

    this.#documents[language].images.push({ id, ids, url, type });
    // TODO
  }

  deleteImage(language, index) {
    if (this.#documents[language] && this.#documents[language].images) {
      this.#documents[language].images.splice(index, 1);
    }
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
    // TODO: groups for images

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

 ${this.#generateTEIFacsimiles()}

 ${Object.entries(this.#documents)
   .map((entry) => entry[1].document)
   .join("")}
</TEI>`;
  }

  #generateTEIFacsimiles() {
    return `
  <facsimile>
   ${Object.entries(this.#documents)
     .map((entry) => entry[1].images || [])
     .flat()
     .map((image) => {
       if (!image.url || !image.type) return "";

       // TODO: escape params
       if (image.type === "URL")
         return `<graphic id="${image.id}" url="${image.url}"/>`;

       // TODO: what about IIIF?!?
       // TODO: escape params
       if (image.type === "IIIF")
         return `<graphic id="${image.id}" url=${image.url}"/>`;
     })}
  </facsimile>
`;
  }
}

const i = new Data();
export default i;
