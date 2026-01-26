import { TEI_NS, parseTEIFile, parseTEIString } from "./TEIUtils.js";
import { listCollection, fetchFile, writeFile } from "./existdb.js";

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

const TEIAuthors = (dom) =>
  dom.evaluate(
    "/tei:TEI/tei:teiHeader//tei:titleStmt/tei:author",
    dom,
    (prefix) => (prefix === "tei" ? TEI_NS : null),
    XPathResult.ANY_TYPE,
    null,
  );

const TEIResps = (dom) =>
  dom.evaluate(
    "/tei:TEI/tei:teiHeader//tei:titleStmt/tei:respStmt/tei:name",
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
        TEIPubStatement(dom).iterateNext().textContent =
          data.project.pubStatement;
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

  // Authors
  {
    setter: (dom, data) => {
      const tsRes = dom.evaluate(
        "/tei:TEI/tei:teiHeader/tei:fileDesc/tei:titleStmt",
        dom,
        (prefix) => (prefix === "tei" ? TEI_NS : null),
        XPathResult.ANY_TYPE,
        null,
      );
      const titleStmt = tsRes.iterateNext();
      if (!titleStmt) return;

      Array.from(titleStmt.querySelectorAll("author")).forEach((e) =>
        e.remove(),
      );

      if (Array.isArray(data.project.authors)) {
        data.project.authors.forEach((a) => {
          if (!a) return;
          const elm = dom.createElementNS(TEI_NS, "author");
          elm.textContent = a;
          titleStmt.appendChild(elm);
        });
      }
    },
    getter: (dom, data) => {
      const authorsIter = TEIAuthors(dom);
      const authors = [];
      while (true) {
        const a = authorsIter.iterateNext();
        if (!a) break;
        authors.push(a.textContent);
      }

      const project = data.project || {};
      if (authors.length) project.authors = authors;
      data.project = project;
    },
  },

  // Responsible persons
  {
    setter: (dom, data) => {
      const tsRes = dom.evaluate(
        "/tei:TEI/tei:teiHeader/tei:fileDesc/tei:titleStmt",
        dom,
        (prefix) => (prefix === "tei" ? TEI_NS : null),
        XPathResult.ANY_TYPE,
        null,
      );
      const titleStmt = tsRes.iterateNext();
      if (!titleStmt) return;

      Array.from(titleStmt.querySelectorAll("respStmt")).forEach((e) =>
        e.remove(),
      );

      if (Array.isArray(data.project.resps)) {
        data.project.resps.forEach((r) => {
          if (!r) return;
          const respStmt = dom.createElementNS(TEI_NS, "respStmt");
          const nameElm = dom.createElementNS(TEI_NS, "name");
          nameElm.textContent = r;
          respStmt.appendChild(nameElm);
          titleStmt.appendChild(respStmt);
        });
      }
    },
    getter: (dom, data) => {
      const respsIter = TEIResps(dom);
      const resps = [];
      while (true) {
        const r = respsIter.iterateNext();
        if (!r) break;
        resps.push(r.textContent);
      }

      const project = data.project || {};
      if (resps.length) project.resps = resps;
      data.project = project;
    },
  },

  // Extended metadata fields
  {
    setter: (dom, data) => {
      const getOrCreate = (xpath, parent, tagName) => {
        const result = dom.evaluate(xpath, dom, (prefix) => (prefix === "tei" ? TEI_NS : null), XPathResult.ANY_TYPE, null);
        let elm = result.iterateNext();
        if (!elm && parent) {
          elm = dom.createElementNS(TEI_NS, tagName);
          parent.appendChild(elm);
        }
        return elm;
      };

      const teiHeader = getOrCreate("/tei:TEI/tei:teiHeader", dom.documentElement, "teiHeader");
      const fileDesc = getOrCreate("/tei:TEI/tei:teiHeader/tei:fileDesc", teiHeader, "fileDesc");
      const titleStmt = getOrCreate("/tei:TEI/tei:teiHeader/tei:fileDesc/tei:titleStmt", fileDesc, "titleStmt");
      const publicationStmt = getOrCreate("/tei:TEI/tei:teiHeader/tei:fileDesc/tei:publicationStmt", fileDesc, "publicationStmt");
      const sourceDesc = getOrCreate("/tei:TEI/tei:teiHeader/tei:fileDesc/tei:sourceDesc", fileDesc, "sourceDesc");

      // Subtitle
      if (data.project.subtitle) {
        let subtitle = titleStmt.querySelector("title[type='sub']");
        if (!subtitle) {
          subtitle = dom.createElementNS(TEI_NS, "title");
          subtitle.setAttribute("type", "sub");
          titleStmt.appendChild(subtitle);
        }
        subtitle.textContent = data.project.subtitle;
      }

      // Editors
      Array.from(titleStmt.querySelectorAll("editor")).forEach((e) => e.remove());
      if (Array.isArray(data.project.editors)) {
        data.project.editors.forEach((e) => {
          if (!e) return;
          const elm = dom.createElementNS(TEI_NS, "editor");
          elm.textContent = e;
          titleStmt.appendChild(elm);
        });
      }

      // Publisher
      if (data.project.publisher) {
        let pub = publicationStmt.querySelector("publisher");
        if (!pub) {
          pub = dom.createElementNS(TEI_NS, "publisher");
          publicationStmt.appendChild(pub);
        }
        pub.textContent = data.project.publisher;
      }

      // Publication place
      if (data.project.pubPlace) {
        let place = publicationStmt.querySelector("pubPlace");
        if (!place) {
          place = dom.createElementNS(TEI_NS, "pubPlace");
          publicationStmt.appendChild(place);
        }
        place.textContent = data.project.pubPlace;
      }

      // Publication date
      if (data.project.pubDate) {
        let date = publicationStmt.querySelector("date");
        if (!date) {
          date = dom.createElementNS(TEI_NS, "date");
          publicationStmt.appendChild(date);
        }
        date.textContent = data.project.pubDate;
      }

      // Availability/License
      if (data.project.availability) {
        let avail = publicationStmt.querySelector("availability");
        if (!avail) {
          avail = dom.createElementNS(TEI_NS, "availability");
          publicationStmt.appendChild(avail);
        }
        let p = avail.querySelector("p");
        if (!p) {
          p = dom.createElementNS(TEI_NS, "p");
          avail.appendChild(p);
        }
        p.textContent = data.project.availability;
      }

      // Edition
      if (data.project.edition) {
        let editionStmt = fileDesc.querySelector("editionStmt");
        if (!editionStmt) {
          editionStmt = dom.createElementNS(TEI_NS, "editionStmt");
          fileDesc.insertBefore(editionStmt, publicationStmt);
        }
        let edition = editionStmt.querySelector("edition");
        if (!edition) {
          edition = dom.createElementNS(TEI_NS, "edition");
          editionStmt.appendChild(edition);
        }
        edition.textContent = data.project.edition;
      }

      // Series
      if (data.project.series) {
        let seriesStmt = fileDesc.querySelector("seriesStmt");
        if (!seriesStmt) {
          seriesStmt = dom.createElementNS(TEI_NS, "seriesStmt");
          fileDesc.appendChild(seriesStmt);
        }
        let title = seriesStmt.querySelector("title");
        if (!title) {
          title = dom.createElementNS(TEI_NS, "title");
          seriesStmt.appendChild(title);
        }
        title.textContent = data.project.series;
      }

      // Source description
      if (data.project.sourceDesc) {
        let p = sourceDesc.querySelector("p");
        if (!p) {
          p = dom.createElementNS(TEI_NS, "p");
          sourceDesc.appendChild(p);
        }
        p.textContent = data.project.sourceDesc;
      }

      // Extent
      if (data.project.extent) {
        let extent = fileDesc.querySelector("extent");
        if (!extent) {
          extent = dom.createElementNS(TEI_NS, "extent");
          fileDesc.insertBefore(extent, publicationStmt);
        }
        extent.textContent = data.project.extent;
      }

      // Profile Description
      let profileDesc = dom.evaluate("/tei:TEI/tei:teiHeader/tei:profileDesc", dom, (prefix) => (prefix === "tei" ? TEI_NS : null), XPathResult.ANY_TYPE, null).iterateNext();
      if (!profileDesc) {
        profileDesc = dom.createElementNS(TEI_NS, "profileDesc");
        teiHeader.appendChild(profileDesc);
      }

      // Abstract
      if (data.project.abstract) {
        let abstract = profileDesc.querySelector("abstract");
        if (!abstract) {
          abstract = dom.createElementNS(TEI_NS, "abstract");
          profileDesc.appendChild(abstract);
        }
        let p = abstract.querySelector("p");
        if (!p) {
          p = dom.createElementNS(TEI_NS, "p");
          abstract.appendChild(p);
        }
        p.textContent = data.project.abstract;
      }

      // Keywords
      if (Array.isArray(data.project.keywords) && data.project.keywords.length > 0) {
        let textClass = profileDesc.querySelector("textClass");
        if (!textClass) {
          textClass = dom.createElementNS(TEI_NS, "textClass");
          profileDesc.appendChild(textClass);
        }
        let keywords = textClass.querySelector("keywords");
        if (!keywords) {
          keywords = dom.createElementNS(TEI_NS, "keywords");
          textClass.appendChild(keywords);
        }
        Array.from(keywords.querySelectorAll("term")).forEach((e) => e.remove());
        data.project.keywords.forEach((k) => {
          if (!k) return;
          const term = dom.createElementNS(TEI_NS, "term");
          term.textContent = k;
          keywords.appendChild(term);
        });
      }

      // Classification
      if (data.project.classification) {
        let textClass = profileDesc.querySelector("textClass");
        if (!textClass) {
          textClass = dom.createElementNS(TEI_NS, "textClass");
          profileDesc.appendChild(textClass);
        }
        let classCode = textClass.querySelector("classCode");
        if (!classCode) {
          classCode = dom.createElementNS(TEI_NS, "classCode");
          textClass.appendChild(classCode);
        }
        classCode.textContent = data.project.classification;
      }

      // Encoding Description
      let encodingDesc = dom.evaluate("/tei:TEI/tei:teiHeader/tei:encodingDesc", dom, (prefix) => (prefix === "tei" ? TEI_NS : null), XPathResult.ANY_TYPE, null).iterateNext();
      if (data.project.encodingDesc || data.project.projectDesc) {
        if (!encodingDesc) {
          encodingDesc = dom.createElementNS(TEI_NS, "encodingDesc");
          teiHeader.appendChild(encodingDesc);
        }

        if (data.project.projectDesc) {
          let projectDesc = encodingDesc.querySelector("projectDesc");
          if (!projectDesc) {
            projectDesc = dom.createElementNS(TEI_NS, "projectDesc");
            encodingDesc.appendChild(projectDesc);
          }
          let p = projectDesc.querySelector("p");
          if (!p) {
            p = dom.createElementNS(TEI_NS, "p");
            projectDesc.appendChild(p);
          }
          p.textContent = data.project.projectDesc;
        }

        if (data.project.encodingDesc) {
          let editorialDecl = encodingDesc.querySelector("editorialDecl");
          if (!editorialDecl) {
            editorialDecl = dom.createElementNS(TEI_NS, "editorialDecl");
            encodingDesc.appendChild(editorialDecl);
          }
          let p = editorialDecl.querySelector("p");
          if (!p) {
            p = dom.createElementNS(TEI_NS, "p");
            editorialDecl.appendChild(p);
          }
          p.textContent = data.project.encodingDesc;
        }
      }

      // Funding
      if (data.project.funding || data.project.sponsor || (Array.isArray(data.project.funder) && data.project.funder.length > 0)) {
        if (data.project.funding) {
          let funding = titleStmt.querySelector("funder");
          if (!funding) {
            funding = dom.createElementNS(TEI_NS, "funder");
            titleStmt.appendChild(funding);
          }
          funding.textContent = data.project.funding;
        }

        if (data.project.sponsor) {
          let sponsor = titleStmt.querySelector("sponsor");
          if (!sponsor) {
            sponsor = dom.createElementNS(TEI_NS, "sponsor");
            titleStmt.appendChild(sponsor);
          }
          sponsor.textContent = data.project.sponsor;
        }

        if (Array.isArray(data.project.funder)) {
          data.project.funder.forEach((f) => {
            if (!f) return;
            const funder = dom.createElementNS(TEI_NS, "funder");
            funder.textContent = f;
            titleStmt.appendChild(funder);
          });
        }
      }

      // Original Language
      if (data.project.originalLang) {
        let langUsage = profileDesc.querySelector("langUsage");
        if (!langUsage) {
          langUsage = dom.createElementNS(TEI_NS, "langUsage");
          profileDesc.appendChild(langUsage);
        }
        let language = dom.createElementNS(TEI_NS, "language");
        language.setAttribute("ident", data.project.originalLang);
        language.textContent = data.project.originalLang;
        langUsage.insertBefore(language, langUsage.firstChild);
      }
    },

    getter: (dom, data) => {
      const project = data.project || {};

      // Subtitle
      const subtitle = dom.querySelector("teiHeader fileDesc titleStmt title[type='sub']");
      if (subtitle) project.subtitle = subtitle.textContent;

      // Editors
      const editors = Array.from(dom.querySelectorAll("teiHeader fileDesc titleStmt editor")).map(e => e.textContent);
      if (editors.length) project.editors = editors;

      // Publisher
      const publisher = dom.querySelector("teiHeader fileDesc publicationStmt publisher");
      if (publisher) project.publisher = publisher.textContent;

      // Publication place
      const pubPlace = dom.querySelector("teiHeader fileDesc publicationStmt pubPlace");
      if (pubPlace) project.pubPlace = pubPlace.textContent;

      // Publication date
      const pubDate = dom.querySelector("teiHeader fileDesc publicationStmt date");
      if (pubDate) project.pubDate = pubDate.textContent;

      // Availability
      const availability = dom.querySelector("teiHeader fileDesc publicationStmt availability p");
      if (availability) project.availability = availability.textContent;

      // Edition
      const edition = dom.querySelector("teiHeader fileDesc editionStmt edition");
      if (edition) project.edition = edition.textContent;

      // Series
      const series = dom.querySelector("teiHeader fileDesc seriesStmt title");
      if (series) project.series = series.textContent;

      // Source description
      const sourceDesc = dom.querySelector("teiHeader fileDesc sourceDesc p");
      if (sourceDesc) project.sourceDesc = sourceDesc.textContent;

      // Extent
      const extent = dom.querySelector("teiHeader fileDesc extent");
      if (extent) project.extent = extent.textContent;

      // Abstract
      const abstract = dom.querySelector("teiHeader profileDesc abstract p");
      if (abstract) project.abstract = abstract.textContent;

      // Keywords
      const keywords = Array.from(dom.querySelectorAll("teiHeader profileDesc textClass keywords term")).map(t => t.textContent);
      if (keywords.length) project.keywords = keywords;

      // Classification
      const classification = dom.querySelector("teiHeader profileDesc textClass classCode");
      if (classification) project.classification = classification.textContent;

      // Project description
      const projectDesc = dom.querySelector("teiHeader encodingDesc projectDesc p");
      if (projectDesc) project.projectDesc = projectDesc.textContent;

      // Encoding description
      const encodingDesc = dom.querySelector("teiHeader encodingDesc editorialDecl p");
      if (encodingDesc) project.encodingDesc = encodingDesc.textContent;

      // Funding
      const funding = dom.querySelector("teiHeader fileDesc titleStmt funder");
      if (funding) project.funding = funding.textContent;

      // Sponsor
      const sponsor = dom.querySelector("teiHeader fileDesc titleStmt sponsor");
      if (sponsor) project.sponsor = sponsor.textContent;

      // Funders (multiple)
      const funders = Array.from(dom.querySelectorAll("teiHeader fileDesc titleStmt funder")).map(f => f.textContent);
      if (funders.length) project.funder = funders;

      // Original language
      const originalLang = dom.querySelector("teiHeader profileDesc langUsage language");
      if (originalLang) project.originalLang = originalLang.getAttribute("ident") || originalLang.textContent;

      data.project = project;
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

  renameDocumentLanguage(oldLanguage, newLanguage) {
    if (!this.#documents[oldLanguage]) {
      return;
    }

    // Don't rename if target language already exists
    if (this.#documents[newLanguage]) {
      console.warn(`Language ${newLanguage} already exists, cannot rename`);
      return;
    }

    // Move document from old language to new language
    this.#documents[newLanguage] = this.#documents[oldLanguage];
    delete this.#documents[oldLanguage];
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
    this.#changed = true;
  }

  deleteImage(language, index) {
    if (this.#documents[language] && this.#documents[language].images) {
      this.#documents[language].images.splice(index, 1);
      this.#changed = true;
    }
  }

  setImages(language, images) {
    if (!this.#documents[language]) {
      this.#documents[language] = {};
    }

    this.#documents[language].images = Array.isArray(images) ? images : [];
    this.#changed = true;
  }

  async readFromFile(file) {
    const { dom, isDiscept } = await parseTEIFile(file);

    if (!isDiscept) {
      throw new Error(Data.ERR_NO_DISCEPT);
    }

    this.#documents = {};

    for (const helper of helpers) {
      helper.getter(dom, this);
    }

    // TODO: extract the project details

    this.#changed = false;
  }

  readFromString(str) {
    const { dom, isDiscept } = parseTEIString(str);

    if (!isDiscept) {
      throw new Error(Data.ERR_NO_DISCEPT);
    }

    this.#documents = {};

    for (const helper of helpers) {
      helper.getter(dom, this);
    }

    this.#changed = false;
  }

  async readFromExistDB(url, collection, user, password, proxy) {
    const files = await listCollection(url, collection, user, password, proxy);
    const parser = new DOMParser();
    const dom = parser.parseFromString(
      `<TEI xmlns="${TEI_NS}"><teiHeader/><standOff/></TEI>`,
      "text/xml",
    );

    for (const name of files) {
      const xml = await fetchFile(url, collection, name, user, password, proxy);
      const fileDom = parser.parseFromString(xml, "text/xml");
      if (!fileDom.firstElementChild) continue;
      dom.documentElement.appendChild(
        dom.importNode(fileDom.documentElement, true),
      );
    }

    const s = new XMLSerializer();
    this.readFromString(s.serializeToString(dom));
  }

  async saveToExistDB(url, collection, user, password, proxy) {
    const xml = this.generateTEI();
    await writeFile(url, collection, "discept.xml", xml, user, password, proxy);
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

    // TODO: groups for images

    const s = new XMLSerializer();
    return s.serializeToString(dom);
  }
}

const i = new Data();
export default i;
