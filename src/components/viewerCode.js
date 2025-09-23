import { TEI_VIEWER_CORE } from './teiViewerCore.js';

// Get the core utilities as a string for inlining
const getCoreUtilities = () => {
  // This will be the stringified version of TEI_VIEWER_CORE for standalone HTML
  return `
    const TEI_VIEWER_CORE = {
      detectLanguage(langElement) {
        if (!langElement) return null;
        const lang = langElement.textContent?.toLowerCase() || langElement.getAttribute("ident")?.toLowerCase();
        if (!lang) return null;
        const languageMap = {
          'it': ['it', 'ita', 'italiano', 'italian'],
          'de': ['de', 'deu', 'deutsch', 'tedesco', 'german'],
          'en': ['en', 'eng', 'english', 'inglese'],
          'fr': ['fr', 'fra', 'francais', 'french']
        };
        for (const [key, variants] of Object.entries(languageMap)) {
          if (variants.some(variant => lang.includes(variant))) {
            return key;
          }
        }
        return lang.substring(0, 2);
      },
      extractTextElements(tei) {
        const allElements = Array.from(tei.querySelectorAll("text p, text date, text head"));
        const validElements = [];

        allElements.forEach((element) => {
          const text = element.textContent.trim();
          if (!text) return;

          // Include all elements for now to avoid missing content
          // TODO: Implement smarter deduplication that handles mixed structures
          validElements.push(element);
        });
        return validElements;
      },
      processAlignments(xml) {
        const palette = [
          "rgba(94, 146, 120, 0.15)", "rgba(228, 220, 207, 0.25)",
          "rgba(94, 146, 120, 0.08)", "rgba(228, 220, 207, 0.15)",
          "rgba(46, 46, 46, 0.05)", "rgba(107, 107, 107, 0.08)",
          "rgba(94, 146, 120, 0.20)", "rgba(228, 220, 207, 0.30)",
          "rgba(94, 146, 120, 0.10)", "rgba(228, 220, 207, 0.20)",
          "rgba(46, 46, 46, 0.08)", "rgba(107, 107, 107, 0.05)"
        ];
        const linkMap = new Map();
        const colorMap = new Map();
        const links = Array.from(xml.querySelectorAll("linkGrp[type='translation'] > link"));
        links.forEach((link, idx) => {
          const targets = link.getAttribute("target");
          if (!targets) return;
          const [id1, id2] = targets.split(" ").map(s => s.replace("#", ""));
          const color = palette[idx % palette.length];
          linkMap.set(id1, id2);
          linkMap.set(id2, id1);
          colorMap.set(id1, color);
          colorMap.set(id2, color);
        });
        return { linkMap, colorMap };
      },
      extractLanguageData(xml, colorMap) {
        const teis = xml.querySelectorAll("TEI > TEI");
        const langData = {};
        teis.forEach(tei => {
          const langElement = tei.querySelector("language");
          const langKey = this.detectLanguage(langElement);
          if (!langKey) return;
          const textElements = this.extractTextElements(tei);
          const verses = [];
          textElements.forEach((element, index) => {
            const text = element.textContent.trim();
            const id = element.getAttribute("xml:id") || null;
            const color = id ? (colorMap.get(id) || "") : "";
            const isAligned = id ? colorMap.has(id) : false;
            verses.push({
              id: id || \`element-\${index + 1}\`,
              text,
              color,
              n: index + 1,
              isAligned
            });
          });
          langData[langKey] = verses;
        });
        return langData;
      }
    };
  `;
};

// Complete viewer code for embedding in standalone HTML
export const getFullViewerCode = () => `
  ${getCoreUtilities()}
class TEIAlignmentViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.linkMap = new Map();
    this.colorMap = new Map();
    this.locked = new Set();
    this.showNumbers = true;
  }

  async connectedCallback() {
    // Load embedded TEI from script tag
    const embeddedTEI = document.getElementById('embedded-tei');
    if (embeddedTEI) {
      this.renderTEI(embeddedTEI.textContent);
    }
  }

  renderTEI(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "application/xml");

    const shadow = this.shadowRoot;
    const style = document.createElement("style");
    style.textContent = \`
      :host {
        font-family: 'Inter', 'Roboto', sans-serif;
        display: block;
        padding: 2rem;
        max-width: 1400px;
        margin: auto;
        background: #F6F5F3;
        min-height: 100vh;
      }
      .header {
        background: #FFFFFF;
        padding: 2rem;
        margin-bottom: 2rem;
        border-radius: 16px;
        box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.06);
      }
      .header h2 {
        color: #2E2E2E;
        margin-top: 0;
        font-weight: 600;
      }
      .header p {
        color: #6B6B6B;
        margin-bottom: 1rem;
      }
      .layout {
        display: flex;
        flex-direction: row;
        gap: 1.5rem;
      }
      .sidebar {
        width: 240px;
        background: #FFFFFF;
        border: 1px solid #E4DCCF;
        padding: 1rem;
        border-radius: 16px;
        max-height: 600px;
        overflow-y: auto;
        transition: all 0.3s ease;
        box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.06);
      }
      .sidebar-toggle {
        cursor: pointer;
        background: #5E9278;
        color: white;
        border: none;
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 1rem;
        border-radius: 10px;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      .sidebar-toggle:hover {
        background: #4A7560;
      }
      .sidebar.minimized {
        width: 50px;
        padding: 0.5rem;
        overflow: hidden;
      }
      .sidebar.minimized a {
        display: none;
      }
      .sidebar a {
        display: block;
        font-size: 0.85rem;
        color: #5E9278;
        text-decoration: none;
        padding: 0.6rem 0.75rem;
        margin: 0.3rem 0;
        border-radius: 8px;
        border-left: 3px solid transparent;
        transition: all 0.2s;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sidebar a:hover {
        background: #E4DCCF;
        border-left-color: #5E9278;
        transform: translateX(2px);
      }
      .controls {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        /* border-top: 1px solid #E4DCCF; */
      }
      .controls button {
        background: #5E9278;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      .controls button:hover {
        background: #4A7560;
      }
      .cards {
        display: flex;
        flex-direction: row;
        gap: 1.5rem;
        flex: 1;
      }
      .card {
        flex: 1;
        background: #FFFFFF;
        border: 1px solid #E4DCCF;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0px 2px 12px rgba(0, 0, 0, 0.06);
      }
      .card h3 {
        margin-top: 0;
        color: #2E2E2E;
        font-weight: 600;
        padding-bottom: 1rem;
        border-bottom: 2px solid #E4DCCF;
        margin-bottom: 1rem;
      }
      .verse {
        padding: 0.75rem 1rem;
        margin: 0.5rem 0;
        border-radius: 10px;
        transition: all 0.2s;
        position: relative;
        color: #2E2E2E;
        line-height: 1.6;
      }
      .verse.aligned {
        cursor: pointer;
        border-left: 3px solid transparent;
      }
      .verse.aligned:hover {
        transform: translateX(4px);
        border-left-color: #5E9278;
      }
      .verse.unaligned {
        opacity: 0.6;
        font-style: italic;
        border-left: 3px solid #E4DCCF;
      }
      .verse.locked {
        box-shadow: inset 0 0 0 2px #5E9278;
        background: rgba(94, 146, 120, 0.1);
      }
      .verse.hovered {
        box-shadow: 0 0 0 2px #5E9278;
        background: rgba(94, 146, 120, 0.05);
      }
      .aligned-count {
        font-size: 0.8rem;
        color: #6B6B6B;
        font-weight: normal;
      }
      .verse-number {
        position: absolute;
        left: -2rem;
        top: 0.75rem;
        font-size: 0.75rem;
        color: #6B6B6B;
        font-weight: 500;
      }
      .hide-numbers .verse-number {
        display: none;
      }
      @media (max-width: 768px) {
        .layout {
          flex-direction: column;
        }
        .cards {
          flex-direction: column;
        }
        .sidebar {
          width: 100%;
          order: -1;
        }
      }
    \`;

    const wrapper = document.createElement("div");

    // Look for title/author in nested TEI documents (skip wrapper TEI)
    const nestedTEIs = xml.querySelectorAll("TEI > TEI");
    let title = "Title";
    let author = "Author";

    // Try to find title/author from nested TEI documents first
    for (const tei of nestedTEIs) {
      const titleEl = tei.querySelector("teiHeader fileDesc titleStmt title") ||
                      tei.querySelector("teiHeader titleStmt title") ||
                      tei.querySelector("teiHeader title");
      const authorEl = tei.querySelector("teiHeader fileDesc titleStmt author") ||
                       tei.querySelector("teiHeader titleStmt author") ||
                       tei.querySelector("teiHeader author");

      if (titleEl && titleEl.textContent?.trim()) {
        title = titleEl.textContent.trim();
      }
      if (authorEl && authorEl.textContent?.trim()) {
        author = authorEl.textContent.trim();
      }

      // If we found both, break early
      if (title !== "Title" && author !== "Author") break;
    }

    // Fallback to root TEI if nothing found in nested
    if (title === "Title") {
      const titleEl = xml.querySelector("teiHeader fileDesc titleStmt title") ||
                      xml.querySelector("teiHeader titleStmt title") ||
                      xml.querySelector("teiHeader title");
      if (titleEl && titleEl.textContent?.trim()) {
        title = titleEl.textContent.trim();
      }
    }
    if (author === "Author") {
      const authorEl = xml.querySelector("teiHeader fileDesc titleStmt author") ||
                       xml.querySelector("teiHeader titleStmt author") ||
                       xml.querySelector("teiHeader author");
      if (authorEl && authorEl.textContent?.trim()) {
        author = authorEl.textContent.trim();
      }
    }

    wrapper.innerHTML = \`
      <div class="header">
        <h2>\${title}</h2>
        <p><em>\${author}</em></p>
      </div>
    \`;

    // Process alignments and extract language data using core utilities
    const { linkMap, colorMap } = TEI_VIEWER_CORE.processAlignments(xml);
    this.linkMap = linkMap;
    this.colorMap = colorMap;

    const langData = TEI_VIEWER_CORE.extractLanguageData(xml, colorMap);

    const layout = document.createElement("div");
    layout.className = "layout";

    const sidebar = document.createElement("div");
    sidebar.className = "sidebar";
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "sidebar-toggle";
    toggleBtn.textContent = "⇆";
    toggleBtn.onclick = () => sidebar.classList.toggle("minimized");
    sidebar.appendChild(toggleBtn);

    // Get links for sidebar
    const links = Array.from(xml.querySelectorAll("linkGrp[type='translation'] > link"));
    links.forEach((link, idx) => {
      const targets = link.getAttribute("target");
      if (!targets) return;
      const [id1, id2] = targets.split(" ").map(s => s.replace("#", ""));

      // Generate preview text for the link
      const element1 = xml.querySelector(\`[xml\\\\:id="\${id1}"]\`);
      let linkText = \`Alignment \${idx + 1}\`;
      if (element1) {
        const previewText = element1.textContent.trim().substring(0, 30);
        linkText = previewText.length > 30 ? previewText + "..." : previewText;
      }

      const a = document.createElement("a");
      a.href = \`#\${id1}\`;
      a.textContent = linkText;
      a.title = \`Scroll to alignment pair \${idx + 1}\`; // Tooltip
      a.onclick = e => {
        e.preventDefault();
        this.scrollToVerses(id1);
      };
      sidebar.appendChild(a);
    });

    const cards = document.createElement("div");
    cards.className = "cards";

    const makeCard = (lang, verses, label) => {
      const card = document.createElement("div");
      card.className = "card";
      const alignedCount = verses.filter(v => v.isAligned).length;
      card.innerHTML = \`<h3>\${label} <span class="aligned-count">(\${alignedCount} of \${verses.length} aligned)</span></h3>\`;

      verses.forEach(({ id, text, color, n, isAligned }) => {
        const div = document.createElement("div");
        div.className = isAligned ? "verse aligned" : "verse unaligned";
        div.id = id;
        div.dataset.id = id;

        // Apply background color only if aligned
        if (color && isAligned) {
          div.style.backgroundColor = color;
        }

        div.innerHTML = \`<span class="verse-number">\${n}</span>\${text}\`;

        // Only add interaction events for aligned verses
        if (isAligned) {
          div.addEventListener("mouseenter", () => this.highlight(id, true));
          div.addEventListener("mouseleave", () => {
            if (!this.locked.has(id)) this.highlight(id, false);
          });
          div.addEventListener("click", () => {
            if (this.locked.has(id)) {
              this.locked.delete(id);
              this.highlight(id, false);
            } else {
              this.locked.add(id);
              this.highlight(id, true);
            }
          });
        }

        card.appendChild(div);
      });
      return card;
    };

    // Create cards for each language found
    const langs = Object.keys(langData);
    const langLabels = {
      it: "Italian Text",
      de: "German Translation",
      en: "English Translation",
      fr: "French Translation"
    };

    langs.forEach(lang => {
      if (langData[lang] && langData[lang].length > 0) {
        const label = langLabels[lang] || \`Text (\${lang})\`;
        cards.appendChild(makeCard(lang, langData[lang], label));
      }
    });

    layout.appendChild(sidebar);
    layout.appendChild(cards);
    wrapper.appendChild(layout);

    // Clear previous content before rendering new TEI
    this.shadowRoot.innerHTML = '';

    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    // Comment out toggle numbers functionality for now
    // const toggleNumbersBtn = shadow.querySelector("#toggleNumbers");
    // if (toggleNumbersBtn) {
    //   toggleNumbersBtn.onclick = () => {
    //     this.showNumbers = !this.showNumbers;
    //     shadow.querySelectorAll(".card").forEach(card => {
    //       card.classList.toggle("hide-numbers", !this.showNumbers);
    //     });
    //   };
    // }
  }

  highlight(id, on) {
    const partnerId = this.linkMap.get(id);
    const verses = [];

    // Find elements by data-id individually to avoid CSS selector issues
    const allVerses = this.shadowRoot.querySelectorAll('[data-id]');
    allVerses.forEach(verse => {
      const dataId = verse.getAttribute('data-id');
      if (dataId === id || dataId === partnerId) {
        verses.push(verse);
      }
    });

    verses.forEach(verse => verse.classList.toggle("hovered", on));
    if (on) {
      this.locked.has(id) && verses.forEach(v => v.classList.add("locked"));
    } else {
      this.locked.has(id) || verses.forEach(v => v.classList.remove("locked"));
    }
  }

  scrollToVerses(id) {
    const partnerId = this.linkMap.get(id);
    const targets = [];

    // Find elements by ID individually to avoid CSS selector issues
    const element1 = this.shadowRoot.getElementById(id);
    const element2 = partnerId ? this.shadowRoot.getElementById(partnerId) : null;

    if (element1) targets.push(element1);
    if (element2) targets.push(element2);

    targets.forEach(el => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    this.highlight(id, true);
    setTimeout(() => {
      if (!this.locked.has(id)) this.highlight(id, false);
    }, 2000);
  }
}

customElements.define('tei-alignment-viewer', TEIAlignmentViewer);
`;