import * as React from "react";

/**
 * InteractiveXMLViewer Component
 *
 * Unified viewer that can show/hide XML tags while maintaining interactivity.
 * - showTags={true}: Shows opening and closing tags (XML view)
 * - showTags={false}: Hides tags, shows only content (Rendered view)
 * - Allows clicking on elements to select them in both modes
 * - Maintains the same selection logic for alignment
 * - Intelligent formatting: block-level tags get line breaks, inline tags stay inline
 *
 * Props:
 * - xmlContent: TEI XML string to display
 * - onElementInteraction: callback for element interaction (click, hover)
 * - showTags: boolean to show/hide XML tags (default: true)
 * - bodyOnly: boolean to show only body content or entire document (default: true)
 */
export default class InteractiveXMLViewer extends React.Component {
  constructor(props) {
    super(props);
    this.contentRef = React.createRef();
  }

  // Define which TEI tags should be displayed as block-level (with line breaks)
  static BLOCK_LEVEL_TAGS = new Set([
    'TEI', 'teiHeader', 'fileDesc', 'titleStmt', 'publicationStmt',
    'profileDesc', 'langUsage', 'text', 'body', 'div', 'lg',
    'p', 'l', 'ab', 'head', 'sp', 'stage', 'quote', 'note',
    'date', 'trailer', 'list', 'item', 'table', 'row', 'cell',
    'front', 'back', 'group', 'floatingText'
  ]);

  /**
   * Apply semantic styling to TEI elements for better readability
   */
  static applySemanticStyle(element, tagName, teiNode) {
    switch (tagName) {
      case 'head':
        // Headings - bold and larger
        element.style.fontWeight = 'bold';
        element.style.fontSize = '1.15em';
        element.style.marginTop = '0.5em';
        break;

      case 'hi':
        // Highlighting - check rend attribute
        const rend = teiNode.getAttribute('rend');
        if (rend === 'bold' || rend === 'strong') {
          element.style.fontWeight = 'bold';
        } else if (rend === 'italic' || rend === 'italics') {
          element.style.fontStyle = 'italic';
        } else if (rend === 'underline') {
          element.style.textDecoration = 'underline';
        } else if (rend === 'strikethrough') {
          element.style.textDecoration = 'line-through';
        }
        break;

      case 'emph':
        // Emphasis - italic
        element.style.fontStyle = 'italic';
        break;

      case 'del':
        // Deletion - strikethrough with muted color
        element.style.textDecoration = 'line-through';
        element.style.color = '#999';
        break;

      case 'add':
        // Addition - underline with green tint
        element.style.textDecoration = 'underline';
        element.style.color = '#2a7f62';
        break;

      case 'note':
        // Notes - smaller and muted
        element.style.fontSize = '0.9em';
        element.style.color = '#666';
        element.style.fontStyle = 'italic';
        break;

      case 'quote':
        // Quotes - italic with subtle indent
        element.style.fontStyle = 'italic';
        element.style.marginLeft = '1em';
        break;

      case 'title':
        // Title - italic
        element.style.fontStyle = 'italic';
        break;

      case 'foreign':
        // Foreign language - italic with different color
        element.style.fontStyle = 'italic';
        element.style.color = '#5a5a5a';
        break;

      case 'name':
      case 'persName':
      case 'placeName':
        // Names - subtle emphasis
        element.style.fontWeight = '500';
        break;

      case 'ref':
      case 'ptr':
        // References - link-like styling
        element.style.color = '#0066CC';
        element.style.textDecoration = 'underline';
        break;
    }
  }

  componentDidMount() {
    this.renderInteractiveXML();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.xmlContent !== this.props.xmlContent ||
        prevProps.showTags !== this.props.showTags) {
      this.renderInteractiveXML();
    }
  }

  /**
   * Recursively render DOM nodes as interactive HTML with optional visible tags
   */
  renderNode(node, depth = 0) {
    if (!node) return null;

    const showTags = this.props.showTags !== false; // Default to true

    // Text nodes - just return the text
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (!text) return null;

      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      textSpan.style.color = '#2E2E2E';
      return textSpan;
    }

    // Element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.nodeName.toLowerCase();
      const isBlockLevel = InteractiveXMLViewer.BLOCK_LEVEL_TAGS.has(tagName);

      // Create container for this element
      const container = document.createElement('div');
      container.style.display = isBlockLevel ? 'block' : 'inline';
      container.style.marginLeft = (showTags && isBlockLevel) ? `${depth * 20}px` : '0';
      container.style.marginBottom = isBlockLevel ? '4px' : '0';

      // Create wrapper for the element (this is what becomes selectable)
      const elementWrapper = document.createElement('span');
      elementWrapper.style.display = isBlockLevel ? 'block' : 'inline';
      elementWrapper.style.cursor = 'pointer';
      elementWrapper.style.transition = 'background-color 0.2s, outline 0.2s';
      elementWrapper.style.padding = '2px 4px';
      elementWrapper.style.borderRadius = '3px';
      elementWrapper.style.margin = '2px 0';

      // Copy xml:id to id attribute for alignment preview to work
      if (node.hasAttribute('xml:id')) {
        elementWrapper.setAttribute('id', node.getAttribute('xml:id'));
      }

      // Store reference to the original TEI element
      elementWrapper.__teiElm = node;

      // Apply semantic styling for better readability
      InteractiveXMLViewer.applySemanticStyle(elementWrapper, tagName, node);

      // Apply interaction logic if provided
      // Make ALL elements interactive (including those with children)
      if (this.props.onElementInteraction) {
        this.props.onElementInteraction(elementWrapper, node);
      }

      // Create opening tag (only if showTags is true)
      if (showTags) {
        const openTag = document.createElement('span');
        openTag.style.color = '#0066CC';
        openTag.style.fontWeight = 'bold';
        openTag.style.fontFamily = 'Monaco, monospace';
        openTag.style.fontSize = '13px';

        let tagText = `<${tagName}`;
        // Add attributes
        if (node.attributes.length > 0) {
          Array.from(node.attributes).forEach(attr => {
            tagText += ` ${attr.name}="${attr.value}"`;
          });
        }
        tagText += '>';
        openTag.textContent = tagText;
        elementWrapper.appendChild(openTag);
      }

      // Container for children
      const childrenContainer = document.createElement('span');
      childrenContainer.style.display = isBlockLevel ? 'block' : 'inline';

      // Process children
      let hasContent = false;
      for (let child of node.childNodes) {
        const childElement = this.renderNode(child, depth + 1);
        if (childElement) {
          childrenContainer.appendChild(childElement);
          hasContent = true;

          // Add space between inline siblings
          if (!isBlockLevel && child.nodeType === Node.ELEMENT_NODE) {
            const space = document.createElement('span');
            space.textContent = ' ';
            childrenContainer.appendChild(space);
          }
        }
      }

      if (hasContent) {
        elementWrapper.appendChild(childrenContainer);
      }

      // Create closing tag (only if showTags is true)
      if (showTags) {
        const closeTag = document.createElement('span');
        closeTag.style.color = '#0066CC';
        closeTag.style.fontWeight = 'bold';
        closeTag.style.fontFamily = 'Monaco, monospace';
        closeTag.style.fontSize = '13px';
        closeTag.textContent = `</${tagName}>`;
        elementWrapper.appendChild(closeTag);
      }

      container.appendChild(elementWrapper);

      return container;
    }

    return null;
  }

  renderInteractiveXML() {
    const { xmlContent } = this.props;

    if (!xmlContent || !xmlContent.trim()) {
      if (this.contentRef.current) {
        this.contentRef.current.innerHTML = '';
      }
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XML parsing error:', parserError.textContent);
        if (this.contentRef.current) {
          this.contentRef.current.innerHTML = '<div style="color: red;">Error parsing XML</div>';
        }
        return;
      }

      // Check if we should render only body or entire document
      const bodyOnly = this.props.bodyOnly !== false; // Default to true

      if (bodyOnly) {
        // Find the <body> element and render only its children
        const bodyElement = xmlDoc.querySelector('body');
        if (!bodyElement) {
          console.warn('No <body> element found in TEI document');
          if (this.contentRef.current) {
            this.contentRef.current.innerHTML = '<div style="color: orange;">No &lt;body&gt; element found</div>';
          }
          return;
        }

        // Clear and render only the body's children (not body itself)
        if (this.contentRef.current) {
          this.contentRef.current.innerHTML = '';

          // Render each child of body directly
          for (let child of bodyElement.childNodes) {
            const rendered = this.renderNode(child, 0);
            if (rendered) {
              this.contentRef.current.appendChild(rendered);
            }
          }
        }
      } else {
        // Render entire document starting from root element
        if (this.contentRef.current) {
          this.contentRef.current.innerHTML = '';
          const rendered = this.renderNode(xmlDoc.documentElement, 0);
          if (rendered) {
            this.contentRef.current.appendChild(rendered);
          }
        }
      }
    } catch (error) {
      console.error('Error rendering interactive XML:', error);
      if (this.contentRef.current) {
        this.contentRef.current.innerHTML = '<div style="color: red;">Error rendering XML</div>';
      }
    }
  }

  render() {
    return (
      <div>
        <style>
          {`
            .selectableTEI {
              background-color: rgba(94, 146, 120, 0.15) !important;
              outline: 1px solid rgba(94, 146, 120, 0.3);
            }
            .selectedTEI {
              background-color: rgba(94, 146, 120, 0.35) !important;
              outline: 2px solid rgb(94, 146, 120);
            }
            .previewAlignmentTEI {
              background-color: rgba(228, 220, 207, 0.5) !important;
              outline: 2px solid rgb(228, 220, 207);
            }
          `}
        </style>
        <div
          style={{
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '14px',
            lineHeight: '1.8',
            padding: '20px',
            backgroundColor: '#f8f8f8',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflowX: 'auto',
            maxHeight: '70vh',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}
          ref={this.contentRef}
        />
      </div>
    );
  }
}
