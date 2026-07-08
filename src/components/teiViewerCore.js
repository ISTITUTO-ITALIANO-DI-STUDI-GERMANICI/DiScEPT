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

    // NOTE: avoid array destructuring here. These core methods are inlined
    // into the standalone viewer via Function.prototype.toString(); Babel
    // transpiles destructuring into a runtime helper (_slicedToArray) whose
    // module-scoped reference is NOT carried into the standalone blob, causing
    // a "ReferenceError: <helper> is not defined" at runtime.
    for (const key of Object.keys(languageMap)) {
      const variants = languageMap[key];
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
    // and Structural elements (<head>, <date>, <trailer>, <quote>, <note>),
    // words (<w>) and segments (<seg>)
    // NOTE: <w> is intentionally NOT in this flat selector. Word tokens are
    // attached to their parent line/paragraph as `tokens` (see below) so the
    // line stays a single structural unit instead of one box per word.
    const allElements = Array.from(
      tei.querySelectorAll("text l, text p, text ab, text sp, text stage, text head, text date, text trailer, text quote, text note, text seg")
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
        return;
      }

      // Element wrapping word tokens (<w xml:id>...): keep the element as the
      // structural unit and attach its words as `tokens`. The words render
      // inline within the line and can be aligned individually.
      const words = Array.from(element.querySelectorAll("w"))
        .filter(w => w.getAttribute("xml:id") && w.textContent.trim());
      if (words.length > 0) {
        validElements.push({
          element: element,
          type: element.tagName.toLowerCase(),
          parent: null,
          tokens: words.map(w => ({ id: w.getAttribute("xml:id"), text: w.textContent.trim() }))
        });
        return;
      }

      if (element.getAttribute("xml:id")) {
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

      // No array destructuring here: it transpiles to a _slicedToArray helper
      // that is undefined in the inlined standalone viewer (see detectLanguage).
      const targetIds2 = targets.split(" ").map(s => s.replace("#", ""));
      const id1 = targetIds2[0];
      const id2 = targetIds2[1];
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

    teis.forEach((tei, teiIndex) => {
      const langElement = tei.querySelector("language");
      // Key by the (unique) language ident so multiple texts in the same
      // language (e.g. two English translations) do not collide.
      const ident = (langElement && langElement.getAttribute("ident"))
        || this.detectLanguage(langElement)
        || `text-${teiIndex + 1}`;
      const label = (langElement && langElement.textContent.trim()) || ident;

      const textElements = this.extractTextElements(tei);
      const verses = [];

      textElements.forEach((item, index) => {
        const element = item.element;
        const text = element.textContent.trim();
        const id = element.getAttribute("xml:id") || null;
        const color = id ? (colorMap.get(id) || "") : "";
        const isAligned = id ? colorMap.has(id) : false;

        // Word-level tokens (if the element wraps <w> children)
        const tokens = item.tokens ? item.tokens.map(t => ({
          id: t.id,
          text: t.text,
          isAligned: colorMap.has(t.id),
          color: colorMap.get(t.id) || ""
        })) : null;

        // Structural position, used by the cantica/canto section filter
        const cantoDiv = element.closest ? element.closest('div[type="canto"]') : null;
        const canticaDiv = element.closest ? element.closest('div[type="cantica"]') : null;

        verses.push({
          id: id || `element-${index + 1}`,
          text,
          tokens,
          color,
          n: index + 1,
          isAligned,
          elementType: item.type,
          parent: item.parent,
          cantica: canticaDiv ? canticaDiv.getAttribute("n") : null,
          canto: cantoDiv ? cantoDiv.getAttribute("n") : null
        });
      });

      langData[ident] = { label, verses };
    });

    return langData;
  },
};
