// TEI Metadata Extraction Utilities
// Provides robust extraction of common metadata from TEI documents

/**
 * Extract title from TEI document
 * Handles various TEI structures and fallback options
 */
export function extractTitle(teiXMLString) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(teiXMLString, "application/xml");

    // Try various common TEI title locations
    const titleSelectors = [
      "teiHeader titleStmt title",           // Standard TEI structure
      "teiHeader fileDesc titleStmt title", // Explicit fileDesc path
      "teiHeader title",                     // Direct under teiHeader
      "TEI teiHeader titleStmt title",       // With TEI root
      "titleStmt title",                     // Simplified selector
      "title"                                // Last resort - any title
    ];

    for (const selector of titleSelectors) {
      const titleElement = xml.querySelector(selector);
      if (titleElement && titleElement.textContent?.trim()) {
        return titleElement.textContent.trim();
      }
    }

    return "Untitled Document";
  } catch (error) {
    console.warn("Error extracting title from TEI:", error);
    return "Untitled Document";
  }
}

/**
 * Extract author from TEI document
 * Handles various TEI structures and multiple authors
 */
export function extractAuthor(teiXMLString) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(teiXMLString, "application/xml");

    // Try various common TEI author locations
    const authorSelectors = [
      "teiHeader titleStmt author",           // Standard TEI structure
      "teiHeader fileDesc titleStmt author", // Explicit fileDesc path
      "teiHeader author",                     // Direct under teiHeader
      "TEI teiHeader titleStmt author",       // With TEI root
      "titleStmt author",                     // Simplified selector
      "author"                                // Last resort - any author
    ];

    for (const selector of authorSelectors) {
      const authorElements = xml.querySelectorAll(selector);
      if (authorElements.length > 0) {
        const authors = Array.from(authorElements)
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 0);

        if (authors.length > 0) {
          return authors.length === 1 ? authors[0] : authors.join("; ");
        }
      }
    }

    return "Unknown Author";
  } catch (error) {
    console.warn("Error extracting author from TEI:", error);
    return "Unknown Author";
  }
}

/**
 * Extract language from TEI document
 * Returns language code (e.g., 'en', 'it', 'de')
 */
export function extractLanguage(teiXMLString) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(teiXMLString, "application/xml");

    // Try various language indicators
    const langSelectors = [
      "TEI[xml\\:lang]",                     // TEI root element lang attribute
      "teiHeader profileDesc langUsage language[ident]", // Language usage declaration
      "text[xml\\:lang]",                    // Text element lang attribute
      "html[lang]"                           // HTML lang attribute (if converted)
    ];

    for (const selector of langSelectors) {
      const element = xml.querySelector(selector);
      if (element) {
        const lang = element.getAttribute('xml:lang') ||
                    element.getAttribute('ident') ||
                    element.getAttribute('lang');
        if (lang) {
          return lang.substring(0, 2).toLowerCase(); // Return just language code
        }
      }
    }

    return "en"; // Default to English
  } catch (error) {
    console.warn("Error extracting language from TEI:", error);
    return "en";
  }
}

/**
 * Extract publication date from TEI document
 */
export function extractDate(teiXMLString) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(teiXMLString, "application/xml");

    const dateSelectors = [
      "teiHeader fileDesc publicationStmt date",
      "teiHeader publicationStmt date",
      "publicationStmt date",
      "teiHeader date"
    ];

    for (const selector of dateSelectors) {
      const dateElement = xml.querySelector(selector);
      if (dateElement && dateElement.textContent?.trim()) {
        return dateElement.textContent.trim();
      }
    }

    return null;
  } catch (error) {
    console.warn("Error extracting date from TEI:", error);
    return null;
  }
}

/**
 * Extract all available metadata from TEI document
 * Returns object with all extracted metadata
 */
export function extractAllMetadata(teiXMLString) {
  return {
    title: extractTitle(teiXMLString),
    author: extractAuthor(teiXMLString),
    language: extractLanguage(teiXMLString),
    date: extractDate(teiXMLString)
  };
}

/**
 * Validate TEI XML structure
 * Returns true if XML appears to be valid TEI
 */
export function validateTEI(teiXMLString) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(teiXMLString, "application/xml");

    // Check for parser errors
    const parserError = xml.querySelector("parsererror");
    if (parserError) {
      return false;
    }

    // Check for basic TEI structure
    const teiRoot = xml.querySelector("TEI");
    const teiHeader = xml.querySelector("teiHeader");

    return teiRoot !== null && teiHeader !== null;
  } catch (error) {
    return false;
  }
}