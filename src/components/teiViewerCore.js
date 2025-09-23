// Core TEI viewer logic - shared between embedded and standalone versions
export const TEI_VIEWER_CORE = {
  // Language detection utilities
  detectLanguage(langElement) {
    if (!langElement) return null;

    const lang = langElement.textContent?.toLowerCase() || langElement.getAttribute("ident")?.toLowerCase();
    if (!lang) return null;

    // Language mapping for better detection
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

    // Fallback to first two letters
    return lang.substring(0, 2);
  },

  /**
   * Extract text elements maintaining paragraph structure with segments
   *
   * This function processes TEI documents that may contain either:
   * - Paragraph-level alignments (traditional approach)
   * - Segment-level alignments (AI-generated fine-grained alignments)
   * - Mixed structures with both paragraphs and segments
   *
   * @param {Document} tei - TEI document to process
   * @returns {Array<Object>} Array of element objects with structure:
   *   {
   *     element: DOMElement,     // The actual DOM element
   *     type: string,           // 'segment', 'p', 'head', 'date'
   *     parent: string|null     // Parent element type for hierarchy
   *   }
   *
   * TODO: This approach handles both paragraph-level and segment-level alignments
   * but may need refinement for complex nested structures or performance optimization
   */
  extractTextElements(tei) {
    if (!tei || typeof tei.querySelectorAll !== 'function') {
      console.warn('TEI document is invalid or missing querySelectorAll method');
      return [];
    }
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

  // Process alignment links into color maps with support for join elements
  // Handles complex TEI alignment structures including join elements that group multiple segments
  processAlignments(xml) {
    if (!xml || typeof xml.querySelectorAll !== 'function') {
      console.warn('XML document is invalid for alignment processing');
      return { linkMap: new Map(), colorMap: new Map() };
    }
    const palette = [
      "rgba(94, 146, 120, 0.15)",   "rgba(228, 220, 207, 0.25)",
      "rgba(94, 146, 120, 0.08)",   "rgba(228, 220, 207, 0.15)",
      "rgba(46, 46, 46, 0.05)",     "rgba(107, 107, 107, 0.08)",
      "rgba(94, 146, 120, 0.20)",   "rgba(228, 220, 207, 0.30)",
      "rgba(94, 146, 120, 0.10)",   "rgba(228, 220, 207, 0.20)",
      "rgba(46, 46, 46, 0.08)",     "rgba(107, 107, 107, 0.05)"
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

  // Extract document data by language
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
          id: id || `element-${index + 1}`,
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
  },

  // Generate the DiScEPT theme CSS
  getThemeCSS() {
    return `
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
    `;
  }
};