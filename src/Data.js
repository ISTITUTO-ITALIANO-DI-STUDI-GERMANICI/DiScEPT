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

const TEIStandOffStatement = (dom) =>
  dom.evaluate(
    "/tei:TEI/tei:standOff",
    dom,
    (prefix) => (prefix === "tei" ? TEI_NS : null),
    XPathResult.ANY_TYPE,
    null,
  );

// Fixed list of categories for alignment links
// The categories are: Linguistic, Semantic, Literal, Other
export const ALIGNMENT_CATEGORIES = [
  "Linguistic",
  "Semantic",
  "Literal",
  "Other",
];

const helpers = [
  // Template
  {
    setter: (dom, data) => {},
    getter: (dom, data) => {},
  },

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
        TEIPubStatement(dom).iterateNext().textContent = data.project.pubStatement;
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
      Array.from(dom.firstElementChild.children)
        .filter((a) => a.tagName === "TEI")
        .map((a) => {
          const languageResult = dom.evaluate(
            "./tei:teiHeader/tei:profileDesc/tei:langUsage/tei:language",
            a,
            (prefix) => (prefix === "tei" ? TEI_NS : null),
            XPathResult.ANY_TYPE,
            null,
          );
          const language = languageResult.iterateNext();
          if (!language) return null;

          const ident = language.getAttribute("ident");
          if (!ident) return null;

          return {
            language: ident,
            document: a.outerHTML,
          };
        })
        .filter((a) => a !== null)
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
        .map((language) => ({
          language,
          doc: data.getDocumentPerLanguage(language),
        }))
        .forEach((obj) => {
          const parser = new DOMParser();
          const domDoc = parser.parseFromString(obj.doc, "text/xml");

          if (
            !domDoc.firstElementChild ||
            // What about TEICorpus? TODO
            domDoc.firstElementChild.tagName !== "TEI" ||
            domDoc.firstElementChild.namespaceURI !== TEI_NS
          ) {
            return;
          }

          const teiHeaderResult = domDoc.evaluate(
            "/tei:TEI/tei:teiHeader",
            domDoc,
            (prefix) => (prefix === "tei" ? TEI_NS : null),
            XPathResult.ANY_TYPE,
            null,
          );
          let teiHeader = teiHeaderResult.iterateNext();
          if (!teiHeader) {
            teiHeader = domDoc.createElementNS(TEI_NS, "teiHeader");
            domDoc.firstElementChild.appendChild(teiHeader);
          }

          const profileDescResult = domDoc.evaluate(
            "/tei:TEI/tei:teiHeader/tei:profileDesc",
            domDoc,
            (prefix) => (prefix === "tei" ? TEI_NS : null),
            XPathResult.ANY_TYPE,
            null,
          );
          let profileDesc = profileDescResult.iterateNext();
          if (!profileDesc) {
            profileDesc = domDoc.createElementNS(TEI_NS, "profileDesc");
            teiHeader.appendChild(profileDesc);
          }

          const langUsageResult = domDoc.evaluate(
            "/tei:TEI/tei:teiHeader/tei:profileDesc/tei:langUsage",
            domDoc,
            (prefix) => (prefix === "tei" ? TEI_NS : null),
            XPathResult.ANY_TYPE,
            null,
          );
          let langUsage = langUsageResult.iterateNext();
          if (!langUsage) {
            langUsage = domDoc.createElementNS(TEI_NS, "langUsage");
            profileDesc.appendChild(langUsage);
          }

          const languageResult = domDoc.evaluate(
            "/tei:TEI/tei:teiHeader/tei:profileDesc/tei:langUsage/tei:language",
            domDoc,
            (prefix) => (prefix === "tei" ? TEI_NS : null),
            XPathResult.ANY_TYPE,
            null,
          );
          let language = languageResult.iterateNext();
          if (!language) {
            language = dom.createElementNS(TEI_NS, "language");
            langUsage.appendChild(language);
          }

          language.setAttribute("ident", obj.language);
          language.textContent = obj.language;

          elm.append(domDoc.firstElementChild);
        });
    },
  },

  // Images
  {
    getter: (dom, data) => {
      const elm = TEIStandOffStatement(dom).iterateNext();
      if (!elm) return;

      const joinList = {};
      Array.from(elm.children)
        .filter((a) => a.tagName === "join")
        .filter((a) => a.getAttribute("facs"))
        .forEach((join) => {
          joinList[join.getAttribute("facs").replace(/^#/, "")] = join
            .getAttribute("target")
            .split(" ")
            .map((id) => id.replace(/^#/, ""));
        });

      const langUsageResult = dom.evaluate(
        `//tei:TEI/tei:teiHeader/tei:profileDesc/tei:langUsage/tei:language`,
        dom,
        (prefix) => (prefix === "tei" ? TEI_NS : null),
        XPathResult.ANY_TYPE,
        null,
      );

      while (true) {
        const languageElm = langUsageResult.iterateNext();
        if (!languageElm) break;

        const language = languageElm.getAttribute("ident");

        let teiElm = languageElm;
        while (teiElm) {
          if (teiElm.tagName === "TEI") break;

          teiElm = teiElm.parentElement;
        }

        const facsimileElm = Array.from(teiElm.children).find(
          (a) => a.tagName === "facsimile",
        );
        if (!facsimileElm) continue;

        Array.from(facsimileElm.children)
          .filter((a) => a.tagName === "graphic")
          .forEach((graphic) => {
            const id = graphic.getAttribute("xml:id");
            if (!id || !joinList[id]) return;

            data.addImage(
              language,
              id,
              joinList[id],
              graphic.getAttribute("url"),
              /* TODO: type */ "URL",
            );
          });
      }
    },

    setter: (dom, data) => {
      // Cleanup existing facsimile elements.
      data.getDocumentLanguages();

      data
        .getDocumentLanguages()
        .map((language) => ({
          images: data.getImages(language) || [],
          language,
        }))
        .forEach((obj) => {
          const langUsageResult = dom.evaluate(
            `//tei:TEI/tei:teiHeader/tei:profileDesc/tei:langUsage/tei:language[@ident="${obj.language}"]`,
            dom,
            (prefix) => (prefix === "tei" ? TEI_NS : null),
            XPathResult.ANY_TYPE,
            null,
          );
          const languageElm = langUsageResult.iterateNext();
          if (!languageElm) {
            console.log(
              `Unable to find an object with language ${obj.language}`,
            );
            return;
          }

          let teiElm = languageElm;
          while (teiElm) {
            if (teiElm.tagName === "TEI") break;

            teiElm = teiElm.parentElement;
          }

          if (!teiElm) {
            console.log("Unable to find the TEI element?!?");
            return;
          }

          let facsimileElm = Array.from(teiElm.children).find(
            (a) => a.tagName === "facsimile",
          );
          if (!facsimileElm) {
            facsimileElm = dom.createElementNS(TEI_NS, "facsimile");
            teiElm.appendChild(facsimileElm);
          }

          Array.from(facsimileElm.children).forEach((child) => child.remove());

          obj.images.forEach((image) => {
            if (!image || !image.url || !image.type) return;

            if (image.type === "URL") {
              const graphic = dom.createElementNS(TEI_NS, "graphic");
              graphic.setAttribute("xml:id", image.id);
              graphic.setAttribute("url", image.url);
              facsimileElm.append(graphic);
            }

            // TODO: what about IIIF?!?
          });

          const standOff = TEIStandOffStatement(dom).iterateNext();

          obj.images.forEach((image) => {
            const joinA = dom.createElementNS(TEI_NS, "join");
            joinA.setAttribute(
              "target",
              image.ids.map((id) => "#" + id).join(" "),
            );
            joinA.setAttribute("facs", "#" + image.id);
            standOff.appendChild(joinA);
          });
        });
    },
  },

  // Alignments
  {
    getter: (dom, data) => {
      const elm = TEIStandOffStatement(dom).iterateNext();
      if (!elm) return;

      const joinList = {};
      Array.from(elm.children)
        .filter((a) => a.tagName === "join")
        .forEach((join) => {
          joinList[join.getAttribute("xml:id")] = join
            .getAttribute("target")
            .split(" ")
            .map((id) => id.replace(/^#/, ""));
        });

      const alignments = [];
      Array.from(elm.children)
        .filter(
          (a) =>
            a.tagName === "linkGrp" && a.getAttribute("type") === "translation",
        )
        .forEach((linkGrp) => {
          const aligns = [];

          let idA = null;
          let idB = null;

          Array.from(linkGrp.children)
            .filter((a) => a.tagName === "link")
            .forEach((link) => {
              const targets = link
                .getAttribute("target")
                .split(" ")
                .map((id) => id.replace(/^#/, ""));
              if (targets.length != 2) {
                console.log("Invalid link with wrong target", link);
                return;
              }

              const obj = {
                a: targets[0] in joinList ? joinList[targets[0]] : [targets[0]],
                b: targets[1] in joinList ? joinList[targets[1]] : [targets[1]],
                category: link.getAttribute("type") || ALIGNMENT_CATEGORIES[0],
              };
              aligns.push(obj);

              if (idA === null) idA = obj.a[0];
              if (idB === null) idB = obj.b[0];
            });

          if (!idA || !idB) return;

          function findLangFromElm(elm) {
            while (elm) {
              if (elm.tagName === "TEI") {
                const languageResult = dom.evaluate(
                  "./tei:teiHeader/tei:profileDesc/tei:langUsage/tei:language",
                  elm,
                  (prefix) => (prefix === "tei" ? TEI_NS : null),
                  XPathResult.ANY_TYPE,
                  null,
                );
                const language = languageResult.iterateNext();
                if (!language) return null;

                return language.getAttribute("ident");
              }

              elm = elm.parentElement;
            }
          }

          function findLangFromXmlId(elm, id) {
            if (elm.getAttribute("xml:id") === id) return findLangFromElm(elm);

            for (const child of Array.from(elm.children)) {
              const found = findLangFromXmlId(child, id);
              if (found) return found;
            }

            return null;
          }

          alignments.push({
            alignments: aligns,
            langA: findLangFromXmlId(dom.firstElementChild, idA),
            langB: findLangFromXmlId(dom.firstElementChild, idB),
          });
        });

      data.alignments = alignments;
    },

    setter: (dom, data) => {
      let linkId = 0;
      const standOff = TEIStandOffStatement(dom).iterateNext();

      for (const alignment of data.alignments) {
        const linkGrp = dom.createElementNS(TEI_NS, "linkGrp");
        linkGrp.setAttribute("type", "translation");

        for (const align of alignment.alignments) {
          let joinIdA = align.a[0];
          if (align.a.length > 1) {
            joinIdA = `join${++linkId}`;
            const joinA = dom.createElementNS(TEI_NS, "join");
            joinA.setAttribute(
              "target",
              align.a.map((id) => "#" + id).join(" "),
            );
            joinA.setAttribute("xml:id", joinIdA);
            if (align.category) {
              joinA.setAttribute("type", align.category);
            }
            standOff.appendChild(joinA);
          }

          let joinIdB = align.b[0];
          if (align.b.length > 1) {
            joinIdB = `join${++linkId}`;
            const joinB = dom.createElementNS(TEI_NS, "join");
            joinB.setAttribute(
              "target",
              align.b.map((id) => "#" + id).join(" "),
            );
            joinB.setAttribute("xml:id", joinIdB);
            if (align.category) {
              joinB.setAttribute("type", align.category);
            }
            standOff.appendChild(joinB);
          }

          const link = dom.createElementNS(TEI_NS, "link");
          link.setAttribute("target", `#${joinIdA} #${joinIdB}`);
          if (align.category) {
            link.setAttribute("type", align.category);
          }
          linkGrp.appendChild(link);
        }

        standOff.appendChild(linkGrp);
      }
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

  get alignments() {
    return this.#alignments;
  }

  set alignments(alignments) {
    this.#alignments = alignments;
  }

  #getAlignments(langA, langB) {
    let a = this.#alignments.find(
      (a) => a.langA === langA && a.langB === langB,
    );
    if (a) {
      return {
        alignments: a.alignments,
        swap: false,
      };
    }

    a = this.#alignments.find((a) => a.langA === langB && a.langB === langA);
    if (a) {
      return {
        alignments: a.alignments,
        swap: true,
      };
    }

    return null;
  }

  getAlignments(langA, langB) {
    const a = this.#getAlignments(langA, langB);
    if (!a) return [];

    if (!a.swap) return a.alignments;

    return a.alignments.map((obj) => ({
      a: obj.b,
      b: obj.a,
      category: obj.category,
    }));
  }

  deleteAlignment(langA, langB, index) {
    const a = this.#getAlignments(langA, langB);
    if (!a) {
      return;
    }

    a.alignments.splice(index, 1);
    this.#changed = true;
  }

  addAlignment(langA, langB, idsA, idsB, category = ALIGNMENT_CATEGORIES[0]) {
    const a = this.#getAlignments(langA, langB);
    if (!a) {
      this.#alignments.push({
        langA,
        langB,
        alignments: [
          {
            a: idsA,
            b: idsB,
            category,
          },
        ],
      });
      return;
    }

    this.#changed = true;

    if (!a.swap) {
      a.alignments.push({
        a: idsA,
        b: idsB,
        category,
      });
      return;
    }

    a.alignments.push({
      a: idsB,
      b: idsA,
      category,
    });
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

    this.#documents[language].images.push({
      id,
      ids,
      url,
      type,
    });
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
      !dom.firstElementChild ||
      // What about TEICorpus? TODO
      dom.firstElementChild.tagName !== "TEI" ||
      dom.firstElementChild.namespaceURI !== TEI_NS
    ) {
      throw new Error(Data.ERR_INVALID_TYPE);
    }

    // TEI/text is not our model.
    if (
      Array.from(dom.firstElementChild.children).find(
        (a) => a.tagName === "text",
      )
    ) {
      throw new Error(Data.ERR_NO_DISCEPT);
    }

    this.#documents = {};

    for (const helper of helpers) {
      helper.getter(dom, this);
    }

    // TODO: extract the project details

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
 <standOff></standOff>
</TEI>`,
      "text/xml",
    );

    for (const helper of helpers) {
      helper.setter(dom, this);
    }

    // TODO: authors
    // TODO: resp
    // TODO: groups for images

    const s = new XMLSerializer();
    return s.serializeToString(dom);
  }
}

const i = new Data();
export default i;
