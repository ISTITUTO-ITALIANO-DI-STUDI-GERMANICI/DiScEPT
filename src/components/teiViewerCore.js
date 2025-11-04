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
   * Extract text elements maintaining structure with segments
   *
   * Universal extraction supporting multiple TEI text-bearing elements:
   * - Poetry: <l> (line), <lg> (line group)
   * - Prose: <p> (paragraph), <ab> (anonymous block)
   * - Drama: <sp> (speech), <stage>
   * - Structure: <head>, <date>, <trailer>, <quote>, <note>
   *
   * Handles both element-level and segment-level alignments:
   * - Element-level: <l xml:id="...">text</l>
   * - Segment-level: <l><seg xml:id="...">text</seg></l>
   *
   * @param {Document} tei - TEI document to process
   * @returns {Array<Object>} Array of element objects with structure:
   *   {
   *     element: DOMElement,     // The actual DOM element
   *     type: string,           // 'segment', 'l', 'p', 'ab', 'head', etc.
   *     parent: string|null     // Parent element type for hierarchy
   *   }
   */
  extractTextElements(tei) {
    if (!tei || typeof tei.querySelectorAll !== 'function') {
      console.warn('TEI document is invalid or missing querySelectorAll method');
      return [];
    }
    const validElements = [];

    // Query all common TEI text-bearing elements in a single selector
    // This preserves document order (important for heads before lines, etc.)
    // Supports: Poetry (<l>), Prose (<p>, <ab>), Drama (<sp>, <stage>),
    // and Structural elements (<head>, <date>, <trailer>, <quote>, <note>)
    const allElements = Array.from(
      tei.querySelectorAll("text l, text p, text ab, text sp, text stage, text head, text date, text trailer, text quote, text note")
    );

    // Helper function to process any text-bearing element
    const processElement = (element) => {
      const segments = element.querySelectorAll("seg");

      if (segments.length > 0) {
        // Element contains segments - extract them individually
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
      } else {
        // Element has no ID and no segments - include for display but not alignment
        if (element.textContent.trim()) {
          validElements.push({
            element: element,
            type: element.tagName.toLowerCase(),
            parent: null
          });
        }
      }
    };

    // Process all elements in document order
    allElements.forEach(processElement);

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

    // Use Sets for O(1) add/has operations instead of arrays with O(n) includes()
    const linkMap = new Map();  // Map<string, Set<string>>
    const colorMap = new Map();
    const joinMap = new Map();

    // First, process join elements that group multiple segments
    const joins = Array.from(xml.querySelectorAll("standOff join"));
    joins.forEach((join) => {
      const joinId = join.getAttribute("xml:id");
      const targets = join.getAttribute("target");

      // Validation: skip empty or invalid joins
      if (!joinId || !targets || !targets.trim()) {
        if (joinId) {
          console.warn(`Join element "${joinId}" has no targets`);
        }
        return;
      }

      const targetIds = targets.split(" ")
        .map(s => s.replace("#", "").trim())
        .filter(s => s.length > 0);

      if (targetIds.length === 0) {
        console.warn(`Join element "${joinId}" has no valid targets after filtering`);
        return;
      }

      joinMap.set(joinId, targetIds);

      // Also add join ID to linkMap so sidebar links work
      // When clicking a join link, it should highlight all segments in the join
      if (!linkMap.has(joinId)) {
        linkMap.set(joinId, new Set());
      }
      targetIds.forEach(targetId => {
        linkMap.get(joinId).add(targetId);
      });
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

      // Create bidirectional mappings for all combinations using Sets for O(1) operations
      // This creates a "visual group" effect: when clicking any segment in a many-to-many
      // alignment, ALL segments on BOTH sides are highlighted together.
      // Example: If join1=(A1,A2,A3) aligns with join2=(B1,B2,B3), clicking A1 highlights:
      //   - A1, A2, A3 (same-side siblings from join1)
      //   - B1, B2, B3 (cross-language partners from join2)
      // This helps users understand the full scope of complex alignments.

      ids1.forEach(segId1 => {
        if (!linkMap.has(segId1)) {
          linkMap.set(segId1, new Set());
        }
        const partners = linkMap.get(segId1);

        // Add cross-language partners - O(1) per add
        ids2.forEach(segId2 => partners.add(segId2));

        // Add same-side siblings (other segments in the same join) - O(1) per add
        ids1.forEach(sibling => {
          if (sibling !== segId1) partners.add(sibling);
        });

        colorMap.set(segId1, color);
      });

      ids2.forEach(segId2 => {
        if (!linkMap.has(segId2)) {
          linkMap.set(segId2, new Set());
        }
        const partners = linkMap.get(segId2);

        // Add cross-language partners - O(1) per add
        ids1.forEach(segId1 => partners.add(segId1));

        // Add same-side siblings (other segments in the same join) - O(1) per add
        ids2.forEach(sibling => {
          if (sibling !== segId2) partners.add(sibling);
        });

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
  }
};
