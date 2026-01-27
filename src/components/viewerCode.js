import { TEI_VIEWER_CORE } from './teiViewerCore.js';

/**
 * ✅ AUTO-GENERATED CODE - NO DUPLICATION
 *
 * This file automatically generates a stringified version of teiViewerCore.js
 * using .toString() on the actual imported functions. No manual synchronization needed!
 *
 * The stringified code is embedded in standalone HTML files which cannot use ES6 imports.
 */

// Get the core utilities as a string for inlining
const getCoreUtilities = () => {
  // Auto-generate stringified version from actual TEI_VIEWER_CORE object
  const methods = Object.keys(TEI_VIEWER_CORE)
    .map(key => {
      if (typeof TEI_VIEWER_CORE[key] === 'function') {
        const funcStr = TEI_VIEWER_CORE[key].toString();
        return `  ${key}${funcStr.substring(funcStr.indexOf('('))}`;
      }
      return null;
    })
    .filter(Boolean)
    .join(',\n\n');

  return `const TEI_VIEWER_CORE = {
${methods}
};`;
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
      /* CSS Variables for theming */
      :host {
        --bg-primary: #FAFAFA;
        --bg-secondary: #FFFFFF;
        --bg-tertiary: #F5F5F5;
        --text-primary: #1A1A1A;
        --text-secondary: #6B7280;
        --text-tertiary: #9CA3AF;
        --accent-primary: #3B82F6;
        --accent-hover: #2563EB;
        --accent-light: #DBEAFE;
        --border-primary: #E5E7EB;
        --border-secondary: #F3F4F6;
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
        --radius-sm: 8px;
        --radius-md: 12px;
        --radius-lg: 16px;
        --radius-xl: 20px;
      }

      :host {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'Roboto', sans-serif;
        display: block;
        padding: 0;
        margin: 0;
        background: var(--bg-primary);
        min-height: 100vh;
        color: var(--text-primary);
        line-height: 1.6;
      }

      * {
        box-sizing: border-box;
      }

      /* Header with gradient background */
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 3rem 2rem;
        margin-bottom: 2rem;
        color: white;
        position: relative;
        overflow: hidden;
      }

      .header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
        opacity: 0.3;
      }

      .header-content {
        max-width: 1400px;
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .header h2 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        font-weight: 700;
        letter-spacing: -0.025em;
      }

      .header p {
        margin: 0;
        opacity: 0.95;
        font-size: 1.1rem;
        font-weight: 400;
      }

      .header-meta {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        font-size: 0.9rem;
        opacity: 0.9;
      }

      .header-meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .header-meta-label {
        opacity: 0.7;
        font-size: 0.85rem;
      }

      /* Main content wrapper */
      .content-wrapper {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 2rem 2rem 2rem;
      }

      .layout {
        display: flex;
        flex-direction: row;
        gap: 2rem;
      }

      /* Sidebar redesign */
      .sidebar {
        width: 280px;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        max-height: calc(100vh - 300px);
        overflow-y: auto;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-md);
        position: sticky;
        top: 2rem;
      }

      .sidebar::-webkit-scrollbar {
        width: 8px;
      }

      .sidebar::-webkit-scrollbar-track {
        background: var(--bg-tertiary);
        border-radius: 4px;
      }

      .sidebar::-webkit-scrollbar-thumb {
        background: var(--text-tertiary);
        border-radius: 4px;
      }

      .sidebar::-webkit-scrollbar-thumb:hover {
        background: var(--text-secondary);
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--border-secondary);
      }

      .sidebar-title {
        font-weight: 600;
        font-size: 1rem;
        color: var(--text-primary);
        margin: 0;
      }

      .sidebar-toggle {
        cursor: pointer;
        background: var(--accent-primary);
        color: white;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        box-shadow: var(--shadow-sm);
      }

      .sidebar-toggle:hover {
        background: var(--accent-hover);
        transform: scale(1.05);
      }

      .sidebar.minimized {
        width: 60px;
        padding: 1rem;
      }

      .sidebar.minimized .sidebar-title,
      .sidebar.minimized a {
        display: none;
      }

      .sidebar.minimized .sidebar-header {
        justify-content: center;
        border: none;
        padding: 0;
        margin: 0;
      }

      .sidebar-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .sidebar a {
        display: flex;
        align-items: center;
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-decoration: none;
        padding: 0.75rem 1rem;
        border-radius: var(--radius-sm);
        border-left: 3px solid transparent;
        transition: all 0.2s ease;
        line-height: 1.4;
        position: relative;
        overflow: hidden;
      }

      .sidebar a::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--accent-primary);
        transform: scaleY(0);
        transition: transform 0.2s ease;
      }

      .sidebar a:hover {
        background: var(--accent-light);
        color: var(--accent-primary);
        transform: translateX(4px);
      }

      .sidebar a:hover::before {
        transform: scaleY(1);
      }

      /* Cards redesign */
      .cards {
        display: flex;
        flex-direction: row;
        gap: 2rem;
        flex: 1;
      }

      .card {
        flex: 1;
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-lg);
        padding: 0;
        box-shadow: var(--shadow-md);
        overflow: hidden;
        transition: box-shadow 0.3s ease;
      }

      .card:hover {
        box-shadow: var(--shadow-lg);
      }

      .card-header {
        padding: 1.5rem;
        background: var(--bg-tertiary);
        border-bottom: 1px solid var(--border-primary);
        position: sticky;
        top: 0;
        z-index: 10;
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.95);
      }

      .card h3 {
        margin: 0;
        color: var(--text-primary);
        font-weight: 600;
        font-size: 1.125rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .card-content {
        padding: 1.5rem;
        max-height: calc(100vh - 400px);
        overflow-y: auto;
      }

      .card-content::-webkit-scrollbar {
        width: 8px;
      }

      .card-content::-webkit-scrollbar-track {
        background: var(--bg-tertiary);
      }

      .card-content::-webkit-scrollbar-thumb {
        background: var(--text-tertiary);
        border-radius: 4px;
      }

      .aligned-count {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        font-weight: 500;
        padding: 0.25rem 0.75rem;
        background: var(--accent-light);
        border-radius: 12px;
      }

      /* Verse elements */
      .verse {
        padding: 1rem 1.25rem;
        margin: 0.75rem 0;
        border-radius: var(--radius-md);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        color: var(--text-primary);
        line-height: 1.7;
        border: 2px solid transparent;
      }

      .verse.aligned {
        cursor: pointer;
        border-left: 4px solid transparent;
      }

      .verse.aligned:hover {
        transform: translateX(4px);
        box-shadow: var(--shadow-sm);
      }

      .verse.unaligned {
        opacity: 0.5;
        font-style: italic;
        border-left: 3px solid var(--border-primary);
        background: var(--bg-tertiary);
      }

      .verse.locked {
        border-color: var(--accent-primary);
        background: var(--accent-light);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        transform: scale(1.02);
      }

      /* Paragraph container for segments */
      .paragraph-container {
        padding: 1rem 1.25rem;
        margin: 0.75rem 0;
        border-radius: var(--radius-md);
        line-height: 1.9;
        background: var(--bg-tertiary);
        transition: background 0.2s ease;
      }

      .paragraph-container:hover {
        background: var(--bg-secondary);
      }

      /* Segment styles */
      .segment {
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        transition: all 0.2s ease;
        color: var(--text-primary);
        display: inline;
        position: relative;
      }

      .segment.aligned {
        cursor: pointer;
        border: 2px solid transparent;
      }

      .segment.aligned:hover {
        box-shadow: 0 0 0 2px var(--accent-light);
      }

      .segment.unaligned {
        opacity: 0.6;
      }

      .segment.locked {
        background: var(--accent-light) !important;
        border: 2px solid var(--accent-primary);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        font-weight: 500;
      }

      .verse-number {
        position: absolute;
        left: -2.5rem;
        top: 1rem;
        font-size: 0.7rem;
        color: var(--text-tertiary);
        font-weight: 600;
        background: var(--bg-tertiary);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        min-width: 2rem;
        text-align: center;
      }

      .hide-numbers .verse-number {
        display: none;
      }

      /* Animations */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .card, .sidebar {
        animation: fadeIn 0.5s ease-out;
      }

      /* Responsive design */
      @media (max-width: 1024px) {
        .content-wrapper {
          padding: 0 1.5rem 1.5rem 1.5rem;
        }

        .layout {
          gap: 1.5rem;
        }

        .cards {
          gap: 1.5rem;
        }
      }

      @media (max-width: 768px) {
        .header {
          padding: 2rem 1.5rem;
        }

        .header h2 {
          font-size: 1.5rem;
        }

        .header p {
          font-size: 1rem;
        }

        .content-wrapper {
          padding: 0 1rem 1rem 1rem;
        }

        .layout {
          flex-direction: column;
          gap: 1rem;
        }

        .cards {
          flex-direction: column;
          gap: 1rem;
        }

        .sidebar {
          width: 100%;
          order: -1;
          position: static;
          max-height: 400px;
        }

        .verse-number {
          position: static;
          display: inline-block;
          margin-right: 0.5rem;
        }
      }
    \`;

    const wrapper = document.createElement("div");

    // Extract title and author from first nested TEI document
    const firstTEI = xml.querySelector("TEI > TEI");
    const title = firstTEI?.querySelector("teiHeader fileDesc titleStmt title")?.textContent?.trim() || "Untitled";
    const author = firstTEI?.querySelector("teiHeader fileDesc titleStmt author")?.textContent?.trim() || "Unknown Author";

    // Count alignments
    const totalAlignments = Array.from(xml.querySelectorAll("linkGrp[type='translation'] > link")).length;

    wrapper.innerHTML = \`
      <div class="header">
        <div class="header-content">
          <h2>\${title}</h2>
          <p>\${author}</p>
          <div class="header-meta">
            <div class="header-meta-item">
              <span class="header-meta-label">Alignments:</span>
              <strong>\${totalAlignments}</strong>
            </div>
            <div class="header-meta-item">
              <span class="header-meta-label">Format:</span>
              <strong>TEI XML</strong>
            </div>
          </div>
        </div>
      </div>
      <div class="content-wrapper"></div>
    \`;

    const contentWrapper = wrapper.querySelector('.content-wrapper');

    // Process alignments and extract language data using core utilities
    const { linkMap, colorMap } = TEI_VIEWER_CORE.processAlignments(xml);
    this.linkMap = linkMap;
    this.colorMap = colorMap;

    const langData = TEI_VIEWER_CORE.extractLanguageData(xml, colorMap);

    const layout = document.createElement("div");
    layout.className = "layout";

    const sidebar = document.createElement("div");
    sidebar.className = "sidebar";

    const sidebarHeader = document.createElement("div");
    sidebarHeader.className = "sidebar-header";

    const sidebarTitle = document.createElement("h4");
    sidebarTitle.className = "sidebar-title";
    sidebarTitle.textContent = "Alignments";

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "sidebar-toggle";
    toggleBtn.textContent = "⇄";
    toggleBtn.onclick = () => sidebar.classList.toggle("minimized");

    sidebarHeader.appendChild(sidebarTitle);
    sidebarHeader.appendChild(toggleBtn);
    sidebar.appendChild(sidebarHeader);

    const sidebarLinks = document.createElement("div");
    sidebarLinks.className = "sidebar-links";

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
      sidebarLinks.appendChild(a);
    });

    sidebar.appendChild(sidebarLinks);

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

      const cardHeader = document.createElement("div");
      cardHeader.className = "card-header";
      cardHeader.innerHTML = \`<h3>\${label} <span class="aligned-count">\${alignedCount}/\${verses.length}</span></h3>\`;
      card.appendChild(cardHeader);

      const cardContent = document.createElement("div");
      cardContent.className = "card-content";

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
            cardContent.appendChild(currentParagraph);
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
          cardContent.appendChild(blockElement);
        }
      });

      card.appendChild(cardContent);
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
    contentWrapper.appendChild(layout);

    // Clear previous content before rendering new TEI
    this.shadowRoot.innerHTML = '';

    shadow.appendChild(style);
    shadow.appendChild(wrapper);
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
    // Convert Set to Array for compatibility with existing code
    const partners = this.linkMap.get(id);
    const partnerIds = partners ? Array.from(partners) : [];
    const verses = [];

    // Find elements by data-id individually to avoid CSS selector issues
    const allVerses = this.shadowRoot.querySelectorAll('[data-id]');
    allVerses.forEach(verse => {
      const dataId = verse.getAttribute('data-id');
      // Check if this is the clicked element or any of its partners
      // Using Set.has() would be O(1) but we already converted to array for other operations
      if (dataId === id || partnerIds.includes(dataId)) {
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
    // Convert Set to Array for compatibility with existing code
    const partners = this.linkMap.get(id);
    const partnerIds = partners ? Array.from(partners) : [];
    const targets = [];

    // Clear all previous highlighting before highlighting new pair
    this.clearAllHighlighting();

    // For join IDs, we need to find the actual segment elements
    // The partnerIds array contains the resolved segment IDs
    if (partnerIds.length > 0) {
      // Highlight using the first segment ID in the join's partner list
      // This will trigger highlighting of all connected segments
      const firstSegmentId = partnerIds[0];

      // Collect all elements to scroll to
      const allIds = [id, ...partnerIds];
      allIds.forEach(elementId => {
        const element = this.shadowRoot.getElementById(elementId);
        if (element) targets.push(element);
      });

      // Scroll to targets
      if (targets.length > 0) {
        targets[0].scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Highlight using first actual segment ID so all partners get highlighted
      this.highlight(firstSegmentId, true);
      setTimeout(() => {
        if (!this.locked.has(firstSegmentId)) this.highlight(firstSegmentId, false);
      }, 2000);
    } else {
      // Regular element (not a join)
      const element = this.shadowRoot.getElementById(id);
      if (element) {
        targets.push(element);

        // Find all partner elements
        partnerIds.forEach(partnerId => {
          const partnerElement = this.shadowRoot.getElementById(partnerId);
          if (partnerElement) targets.push(partnerElement);
        });

        targets.forEach(el => el.scrollIntoView({ behavior: "smooth", block: "center" }));
        this.highlight(id, true);
        setTimeout(() => {
          if (!this.locked.has(id)) this.highlight(id, false);
        }, 2000);
      }
    }
  }
}

customElements.define('tei-alignment-viewer', TEIAlignmentViewer);
`;