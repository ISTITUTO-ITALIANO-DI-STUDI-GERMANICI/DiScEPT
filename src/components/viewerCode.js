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
        const validElements = [];

        // Get all paragraph-level elements
        const paragraphs = Array.from(tei.querySelectorAll("text p"));
        const heads = Array.from(tei.querySelectorAll("text head"));
        const dates = Array.from(tei.querySelectorAll("text date"));

        // Process heads and dates first (they might contain segments too)
        [...heads, ...dates].forEach(element => {
          const segments = element.querySelectorAll("seg");
          if (segments.length > 0) {
            // If element contains segments, extract them individually
            segments.forEach(seg => {
              if (seg.textContent.trim()) {
                validElements.push({
                  element: seg,
                  type: 'segment',
                  parent: element.tagName.toLowerCase()
                });
              }
            });
          } else if (element.getAttribute("xml:id")) {
            // Element itself has an ID and should be aligned as a whole
            if (element.textContent.trim()) {
              validElements.push({
                element: element,
                type: element.tagName.toLowerCase(),
                parent: null
              });
            }
          }
        });

        // Process paragraphs
        paragraphs.forEach(para => {
          const segments = para.querySelectorAll("seg");

          if (segments.length > 0) {
            // Paragraph contains segments - extract each segment
            segments.forEach(seg => {
              if (seg.textContent.trim()) {
                validElements.push({
                  element: seg,
                  type: 'segment',
                  parent: 'p'
                });
              }
            });
          } else if (para.getAttribute("xml:id")) {
            // Paragraph itself has an ID and should be aligned as a whole
            if (para.textContent.trim()) {
              validElements.push({
                element: para,
                type: 'p',
                parent: null
              });
            }
          } else {
            // Paragraph has no ID and no segments - include for display but not alignment
            if (para.textContent.trim()) {
              validElements.push({
                element: para,
                type: 'p',
                parent: null
              });
            }
          }
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
        const joinMap = new Map();

        // First, process join elements that group multiple segments
        const joins = Array.from(xml.querySelectorAll("standOff join"));
        joins.forEach((join) => {
          const joinId = join.getAttribute("xml:id");
          const targets = join.getAttribute("target");
          if (joinId && targets) {
            const targetIds = targets.split(" ").map(s => s.replace("#", ""));
            joinMap.set(joinId, targetIds);
          }
        });

        // Process alignment links
        const links = Array.from(xml.querySelectorAll("linkGrp[type='translation'] > link"));
        links.forEach((link, idx) => {
          const targets = link.getAttribute("target");
          if (!targets) return;

          const [id1, id2] = targets.split(" ").map(s => s.replace("#", ""));
          const color = palette[idx % palette.length];

          // Resolve join references to actual segment IDs
          const resolveIds = (id) => {
            if (joinMap.has(id)) {
              return joinMap.get(id);
            }
            return [id];
          };

          const ids1 = resolveIds(id1);
          const ids2 = resolveIds(id2);

          // Create bidirectional mappings for all combinations
          ids1.forEach(segId1 => {
            ids2.forEach(segId2 => {
              linkMap.set(segId1, segId2);
              linkMap.set(segId2, segId1);
            });
            colorMap.set(segId1, color);
          });

          ids2.forEach(segId2 => {
            colorMap.set(segId2, color);
          });
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
          textElements.forEach((item, index) => {
            const element = item.element;
            const text = element.textContent.trim();
            const id = element.getAttribute("xml:id") || null;
            const color = id ? (colorMap.get(id) || "") : "";
            const isAligned = id ? colorMap.has(id) : false;

            verses.push({
              id: id || \`element-\${index + 1}\`,
              text,
              color,
              n: index + 1,
              isAligned,
              elementType: item.type,
              parent: item.parent
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

// Constants for element types and styling
const ELEMENT_TYPES = {
  SEGMENT: 'segment',
  PARAGRAPH: 'p',
  HEAD: 'head',
  DATE: 'date'
};

const CSS_CLASSES = {
  SEGMENT_ALIGNED: 'segment aligned',
  SEGMENT_UNALIGNED: 'segment unaligned',
  VERSE_ALIGNED: 'verse aligned',
  VERSE_UNALIGNED: 'verse unaligned',
  PARAGRAPH_CONTAINER: 'paragraph-container'
};

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
        transition: border-left-color 0.2s;
      }
      .verse.unaligned {
        opacity: 0.6;
        font-style: italic;
        border-left: 3px solid #E4DCCF;
      }
      .verse.locked {
        border-left-color: #5E9278;
        box-shadow: inset 0 0 0 2px #5E9278;
        background: rgba(94, 146, 120, 0.1);
      }
      /* Paragraph container for segments */
      .paragraph-container {
        padding: 0.75rem 1rem;
        margin: 0.5rem 0;
        border-radius: 10px;
        line-height: 1.8;
        background: rgba(255, 255, 255, 0.3);
      }
      /* Segment styles - inline within paragraphs */
      .segment {
        padding: 0.15rem 0.3rem;
        border-radius: 4px;
        transition: all 0.2s;
        color: #2E2E2E;
        display: inline;
        position: relative;
      }
      .segment.aligned {
        cursor: pointer;
        transition: background-color 0.2s, outline 0.2s;
      }
      .segment.unaligned {
        opacity: 0.7;
      }
      .segment.locked {
        background: rgba(94, 146, 120, 0.2) !important;
        outline: 2px solid #5E9278;
        outline-offset: 2px;
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

    // Extract title and author from first nested TEI document
    const firstTEI = xml.querySelector("TEI > TEI");
    const title = firstTEI?.querySelector("teiHeader fileDesc titleStmt title")?.textContent?.trim() || "Untitled";
    const author = firstTEI?.querySelector("teiHeader fileDesc titleStmt author")?.textContent?.trim() || "Unknown Author";

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
      const element1 = xml.querySelector(\`*[xml\\\\:id="\${id1}"]\`) || xml.getElementById(id1);
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

    // Helper function to add interaction events to aligned elements (click-only)
    const viewer = this; // Capture 'this' reference for use in nested functions
    const addInteractionEvents = (element, id) => {
      element.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent event bubbling

        if (viewer.locked.has(id)) {
          // Unlock clicked element
          viewer.locked.delete(id);
          viewer.highlight(id, false);
        } else {
          // Clear all previous highlighting before locking new pair
          viewer.clearAllHighlighting();
          viewer.locked.add(id);
          viewer.highlight(id, true);
        }
      });
    };

    // Helper function to create segment elements within paragraph containers
    const createSegmentElement = (verseData, currentParagraph) => {
      const { id, text, color, isAligned } = verseData;
      const seg = document.createElement("span");
      seg.className = isAligned ? CSS_CLASSES.SEGMENT_ALIGNED : CSS_CLASSES.SEGMENT_UNALIGNED;
      seg.id = id;
      seg.dataset.id = id;

      if (color && isAligned) {
        seg.style.backgroundColor = color;
      }

      seg.innerHTML = text;

      if (isAligned) {
        addInteractionEvents(seg, id);
      }

      currentParagraph.appendChild(seg);
      return seg;
    };

    // Helper function to create block elements (paragraphs, heads, etc.)
    const createBlockElement = (verseData) => {
      const { id, text, color, n, isAligned } = verseData;
      const div = document.createElement("div");
      div.className = isAligned ? CSS_CLASSES.VERSE_ALIGNED : CSS_CLASSES.VERSE_UNALIGNED;
      div.id = id;
      div.dataset.id = id;

      if (color && isAligned) {
        div.style.backgroundColor = color;
      }

      div.innerHTML = \`<span class="verse-number">\${n}</span>\${text}\`;

      if (isAligned) {
        addInteractionEvents(div, id);
      }

      return div;
    };

    const makeCard = (lang, verses, label) => {
      const card = document.createElement("div");
      card.className = "card";
      const alignedCount = verses.filter(v => v.isAligned).length;
      card.innerHTML = \`<h3>\${label} <span class="aligned-count">(\${alignedCount} of \${verses.length} aligned)</span></h3>\`;

      // State for tracking paragraph containers
      let currentParagraph = null;

      verses.forEach((verseData, index) => {
        const { elementType, parent } = verseData;
        // Handle segment elements within paragraph containers
        if (elementType === ELEMENT_TYPES.SEGMENT && parent === ELEMENT_TYPES.PARAGRAPH) {
          // Create new paragraph container if needed
          if (!currentParagraph || (index > 0 && verses[index - 1].parent !== ELEMENT_TYPES.PARAGRAPH)) {
            currentParagraph = document.createElement("div");
            currentParagraph.className = CSS_CLASSES.PARAGRAPH_CONTAINER;
            card.appendChild(currentParagraph);
          }

          createSegmentElement(verseData, currentParagraph);

          // Add space between consecutive segments
          if (index < verses.length - 1 && verses[index + 1].parent === ELEMENT_TYPES.PARAGRAPH) {
            currentParagraph.appendChild(document.createTextNode(" "));
          }
        } else {
          // Handle block-level elements (paragraphs, heads, etc.)
          currentParagraph = null; // Reset paragraph grouping
          const blockElement = createBlockElement(verseData);
          card.appendChild(blockElement);
        }
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

  // Clear all highlighting from all elements
  clearAllHighlighting() {
    const allElements = this.shadowRoot.querySelectorAll('[data-id]');
    allElements.forEach(element => {
      // Remove locked class from all elements (we'll re-add to current selection)
      element.classList.remove("locked");
    });
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

    // Simply toggle locked state (no hover state needed)
    if (on) {
      verses.forEach(v => v.classList.add("locked"));
    } else {
      verses.forEach(v => v.classList.remove("locked"));
    }
  }

  scrollToVerses(id) {
    const partnerId = this.linkMap.get(id);
    const targets = [];

    // Clear all previous highlighting before highlighting new pair
    this.clearAllHighlighting();

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