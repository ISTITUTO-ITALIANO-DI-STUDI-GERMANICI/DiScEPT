const TEI_NS = "http://www.tei-c.org/ns/1.0";

const TEITitle = (dom) =>
  dom.evaluate(
    "/tei:TEI/tei:teiHeader//tei:title",
    dom,
    (prefix) => (prefix === "tei" ? TEI_NS : null),
    XPathResult.ANY_TYPE,
    null,
  );

const TEIPubStatement = (dom) =>
  dom.evaluate(
    "/tei:TEI/tei:teiHeader//tei:publicationStmt/tei:p",
    dom,
    (prefix) => (prefix === "tei" ? TEI_NS : null),
    XPathResult.ANY_TYPE,
    null,
  );

const helpers = [
  // Template
  { setter: (dom, data) => {}, getter: (dom, data) => {} },

  // Title
  {
    setter: (dom, data) => {
      if (data.project.title) {
        TEITitle(dom).iterateNext().textContent = data.project.title;
      }
    },
    getter: (dom, data) => {
      const elm = TEITitle(dom).iterateNext();

      if (elm) {
        const project = data.project || {};
        project.title = elm.textContent;
        data.project = project;
      }
    },
  },

  // Publication statements
  {
    setter: (dom, data) => {
      if (data.project.pubStatement) {
        TEIPubStatement().iterateNext().textContent = data.project.pubStatement;
      }
    },
    getter: (dom, data) => {
      const elm = TEIPubStatement(dom).iterateNext();

      if (elm) {
        const project = data.project || {};
        project.pubStatement = elm.textContent;
        data.project = project;
      }
    },
  },

  // Documents and languages
  {
    getter: (dom, data) =>
      Array.from(dom.firstChild.children)
        .filter((a) => a.tagName === "TEI")
        .map((a) => ({ language: "TODO", document: a.outerHTML }))
        .forEach((a) => data.addDocumentPerLanguage(a.language, a.document)),
    setter: (dom, data) => {
      const result = dom.evaluate(
        "/tei:TEI",
        dom,
        (prefix) => (prefix === "tei" ? TEI_NS : null),
        XPathResult.ANY_TYPE,
        null,
      );
      const elm = result.iterateNext();

      data
        .getDocumentLanguages()
        .map((language) => data.getDocumentPerLanguage(language))
        .forEach((doc) => {
          const parser = new DOMParser();
          const domDoc = parser.parseFromString(doc, "text/xml");

          if (
            !domDoc.firstChild ||
            // What about TEICorpus? TODO
            domDoc.firstChild.tagName !== "TEI" ||
            domDoc.firstChild.namespaceURI !== TEI_NS
          ) {
            return;
          }

          elm.append(domDoc.firstChild);
        });
    },
  },

  // Images
  {
    getter: (dom, data) => {},
    setter: (dom, data) => {
      const result = dom.evaluate(
        "/tei:TEI/tei:facsimile",
        dom,
        (prefix) => (prefix === "tei" ? TEI_NS : null),
        XPathResult.ANY_TYPE,
        null,
      );
      data
        .getDocumentLanguages()
        .map((language) => data.getImages(language))
        .map((images) => images || [])
        .flat()
        .forEach((image) => {
          if (!image.url || !image.type) return;

          if (image.type === "URL") {
            const graphic = dom.createElementNS(TEI_NS, "graphic");
            graphic.setAttribute("id", image.id);
            graphic.setAttribute("url", image.url);
            result.iterateNext().append(graphic);
          }

          // TODO: what about IIIF?!?
        });
    },
  },
];

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
  }

  deleteImage(language, index) {
    if (this.#documents[language] && this.#documents[language].images) {
      this.#documents[language].images.splice(index, 1);
    }
  }

  async readFromFile(file) {
    const parser = new DOMParser();
    const dom = parser.parseFromString(await file.text(), "text/xml");

    if (
      !dom.firstChild ||
      // What about TEICorpus? TODO
      dom.firstChild.tagName !== "TEI" ||
      dom.firstChild.namespaceURI !== TEI_NS
    ) {
      throw new Error(Data.ERR_INVALID_TYPE);
    }

    // TEI/text is not our model.
    if (Array.from(dom.firstChild.children).find((a) => a.tagName === "text")) {
      throw new Error(Data.ERR_NO_DISCEPT);
    }

    this.#documents = {};

    for (const helper of helpers) {
      helper.getter(dom, this);
    }

    // TODO: extract the project details
    // TODO: extract the images
    // TODO: extract the alignents

    this.#changed = false;
  }

  generateTEI() {
    const parser = new DOMParser();
    const dom = parser.parseFromString(
      `<TEI version="3.3.0" xmlns="${TEI_NS}">
 <teiHeader>
  <fileDesc>
   <titleStmt>
    <title></title>
   </titleStmt>
   <publicationStmt><p></p></publicationStmt>
  </fileDesc>
 </teiHeader>
 <facsimile></facsimile>
</TEI>`,
      "text/xml",
    );

    for (const helper of helpers) {
      helper.setter(dom, this);
    }

    // TODO: authors
    // TODO: resp
    // TODO: aligments
    // TODO: groups for images

    const s = new XMLSerializer();
    return s.serializeToString(dom);
  }
}

const i = new Data();
export default i;
