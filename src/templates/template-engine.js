// Template engine for TEI viewer generation
import { TEI_VIEWER_CORE } from '../components/teiViewerCore.js';

class TEITemplateEngine {
  constructor() {
    this.templates = new Map();
    this.registerDefaultTemplates();
  }

  registerDefaultTemplates() {
    // Default DiScEPT theme
    this.registerTemplate('default', {
      name: 'Default DiScEPT Theme',
      description: 'Standard layout with sidebar and dual-column view',
      htmlTemplate: this.getDefaultHTMLTemplate(),
      styles: TEI_VIEWER_CORE.getThemeCSS(),
      features: {
        sidebar: true,
        numbering: true,
        search: false,
        export: false
      },
      config: {
        layout: 'columns',
        responsive: true,
        containerClass: 'discept-viewer'
      }
    });

    // Academic theme (example)
    this.registerTemplate('academic', {
      name: 'Academic Theme',
      description: 'Clean academic layout with enhanced typography',
      htmlTemplate: this.getAcademicHTMLTemplate(),
      styles: this.getAcademicCSS(),
      features: {
        sidebar: true,
        numbering: true,
        search: true,
        export: true
      },
      config: {
        layout: 'academic',
        responsive: true,
        containerClass: 'academic-viewer'
      }
    });
  }

  registerTemplate(id, template) {
    this.templates.set(id, template);
  }

  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      features: template.features
    }));
  }

  generateHTML(templateId, data) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found`);
    }

    return this.processTemplate(template, data);
  }

  processTemplate(template, data) {
    let html = template.htmlTemplate;

    // Replace placeholders
    const placeholders = {
      '{{title}}': data.title || 'TEI Document',
      '{{author}}': data.author || 'Unknown Author',
      '{{language}}': data.language || 'en',
      '{{styles}}': template.styles,
      '{{teiContent}}': data.teiContent,
      '{{viewerScript}}': this.getViewerScript(template.config),
      '{{containerClass}}': template.config.containerClass || 'tei-viewer'
    };

    Object.entries(placeholders).forEach(([placeholder, value]) => {
      html = html.replace(new RegExp(placeholder, 'g'), value);
    });

    return html;
  }

  getDefaultHTMLTemplate() {
    return `<!DOCTYPE html>
<html lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <title>{{title}} - {{author}}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>{{styles}}</style>
</head>
<body>
  <tei-alignment-viewer class="{{containerClass}}"></tei-alignment-viewer>
  <script type="application/xml" id="embedded-tei">{{teiContent}}</script>
  <script type="module">{{viewerScript}}</script>
</body>
</html>`;
  }

  getAcademicHTMLTemplate() {
    return `<!DOCTYPE html>
<html lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <title>{{title}} - {{author}}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
  <style>{{styles}}</style>
</head>
<body>
  <div class="{{containerClass}}">
    <header class="academic-header">
      <h1>{{title}}</h1>
      <p class="author">{{author}}</p>
    </header>
    <tei-alignment-viewer></tei-alignment-viewer>
  </div>
  <script type="application/xml" id="embedded-tei">{{teiContent}}</script>
  <script type="module">{{viewerScript}}</script>
</body>
</html>`;
  }

  getAcademicCSS() {
    return `
      :host {
        font-family: 'Crimson Text', serif;
        line-height: 1.6;
        color: #333;
        background: #fefefe;
      }
      .academic-header {
        text-align: center;
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 2px solid #ddd;
      }
      .academic-header h1 {
        font-size: 2.5rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }
      .academic-header .author {
        font-size: 1.2rem;
        font-style: italic;
        color: #666;
      }
      /* Override some default styles for academic theme */
      .card {
        font-size: 1.1rem;
        line-height: 1.8;
      }
      .sidebar {
        background: #f8f8f8;
        border: 1px solid #ddd;
      }
    `;
  }

  getViewerScript(config) {
    // Return the appropriate viewer script based on config
    // This would be the actual viewer JavaScript code
    return `
      // TEI Viewer Core utilities
      ${this.getCoreUtilitiesString()}

      // Viewer component with config
      ${this.getViewerComponentString(config)}

      customElements.define('tei-alignment-viewer', TEIAlignmentViewer);
    `;
  }

  getCoreUtilitiesString() {
    // Return stringified version of TEI_VIEWER_CORE
    return `const TEI_VIEWER_CORE = ${JSON.stringify(TEI_VIEWER_CORE, null, 2)};`;
  }

  getViewerComponentString(config) {
    // Return the viewer component code, potentially customized based on config
    // This would be similar to what we have now, but configurable
    return `/* Viewer component code here */`;
  }
}

export default TEITemplateEngine;