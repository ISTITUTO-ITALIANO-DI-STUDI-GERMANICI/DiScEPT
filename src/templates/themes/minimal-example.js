// Example: Minimal Theme for TEI Viewer
// This could be loaded dynamically or registered with the template engine

const MinimalTheme = {
  id: 'minimal',
  name: 'Minimal Theme',
  description: 'Clean, distraction-free reading experience',

  htmlTemplate: `<!DOCTYPE html>
<html lang="{{language}}">
<head>
  <meta charset="UTF-8">
  <title>{{title}}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>{{styles}}</style>
</head>
<body>
  <article class="minimal-viewer">
    <header>
      <h1>{{title}}</h1>
      <p class="author">{{author}}</p>
    </header>
    <tei-alignment-viewer></tei-alignment-viewer>
  </article>
  <script type="application/xml" id="embedded-tei">{{teiContent}}</script>
  <script type="module">{{viewerScript}}</script>
</body>
</html>`,

  styles: `
    :host {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    header h1 {
      font-size: 2rem;
      font-weight: 300;
      margin: 0;
      color: #2c3e50;
    }

    .author {
      font-size: 1.1rem;
      color: #7f8c8d;
      margin: 0.5rem 0 0 0;
    }

    /* Hide sidebar for minimal design */
    .sidebar {
      display: none;
    }

    .layout {
      flex-direction: column;
    }

    .cards {
      flex-direction: column;
      gap: 2rem;
    }

    .card {
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0;
    }

    .card h3 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #34495e;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #3498db;
    }

    .verse {
      padding: 0.5rem 0;
      margin: 0.25rem 0;
      border-radius: 0;
      border-left: none;
      transition: background-color 0.2s;
    }

    .verse.aligned:hover {
      background: #f8f9fa;
      transform: none;
    }

    .verse.unaligned {
      opacity: 0.8;
      font-style: normal;
      border-left: none;
    }

    .verse-number {
      display: none; /* Hide numbers in minimal theme */
    }

    .verse.hovered {
      background: #e3f2fd;
      box-shadow: none;
    }

    .verse.locked {
      background: #bbdefb;
      box-shadow: none;
    }

    @media print {
      .cards {
        display: block;
      }
      .card {
        break-inside: avoid;
        margin-bottom: 2rem;
      }
    }
  `,

  features: {
    sidebar: false,
    numbering: false,
    search: false,
    export: true,
    printOptimized: true
  },

  config: {
    layout: 'single-column',
    responsive: true,
    containerClass: 'minimal-viewer',
    hideElements: ['sidebar', 'verse-numbers']
  }
};

export default MinimalTheme;