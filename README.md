# DiScEPT

**DiScEPT** is a React-based web application for creating digital scholarly editions of parallel and multilingual texts encoded in TEI/XML (Text Encoding Initiative). It provides a step-by-step workflow covering metadata authoring, TEI editing, text alignment, image annotation, and export.

**Live app**: [https://istituto-italiano-di-studi-germanici.github.io/DiScEPT/](https://istituto-italiano-di-studi-germanici.github.io/DiScEPT/)

---

## Features

- **TEI/XML editing** with a Monaco-based code editor and live preview
- **Multi-language document management** — add and remove language tracks freely
- **AI-powered text alignment** — client-side semantic embeddings via Transformers.js (MiniLM L12, E5 small, E5 base, LaBSE)
- **Manual alignment** with category tagging (Linguistic, Semantic, Literal, Other)
- **Image annotation** — associate IIIF or direct-URL images with text segments via OpenSeaDragon
- **Standalone HTML export** — self-contained viewer built on Web Components (`tei-alignment-viewer`)
- **TEI/XML export** with full standOff alignment markup
- **eXistDB sync** — read and write XML documents from/to a remote eXistDB collection
- **Auto-save** to `localStorage` with one-click restore
- **Interactive TEI preview** — semantic rendering with toggleable tag visibility
- **Built-in onboarding** tour powered by driver.js

---

## Workflow

The application guides the user through six sequential steps:

| Step | Name | Description |
|------|------|-------------|
| 1 | **Intro** | Platform overview and bibliographic references |
| 2 | **Project metadata** | Title, authors, editors, publication details, abstract, keywords, funding |
| 3 | **TEI & Translations** | Upload or create TEI documents per language; edit XML; live preview |
| 4 | **Alignments** | Select matching elements across two language panels; AI auto-align or manual linking |
| 5 | **Images** | Attach IIIF/URL images to text segments; preview in OpenSeaDragon |
| 6 | **Export** | Download TEI/XML, standalone HTML viewer, or preview in-browser |

---

## Running Locally

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
```

### Run tests

```bash
npm test
```

---

## eXistDB Proxy Server

To synchronise with an eXistDB instance from a browser (CORS), a small Koa proxy is included:

```bash
npm run proxy
```

This starts a server on port **3001**. In the app, enable the proxy option in the eXistDB sync dialog and point it at `http://localhost:3001`.

The proxy validates that the target URL contains `"exist"` before forwarding requests, and returns descriptive errors on network failures.

---

## Key Components

### `InteractiveXMLViewer`
Renders TEI XML documents as styled HTML with semantic highlighting (bold, italic, strikethrough, etc.) and toggleable tag visibility.

### `SmartAlignButton`

The smart alignment feature automatically proposes correspondences between the text elements of two TEI documents. Everything runs **client-side in the browser** — no data is ever sent to a server.

#### How it works

**1. Embedding**

Each text fragment is converted into a fixed-size vector using a multilingual sentence-embedding model (see [Available models](#available-models) below). The model runs in the browser via [Transformers.js](https://huggingface.co/docs/transformers.js/index), a JavaScript port of the Hugging Face `transformers` library that executes ONNX-serialised models through [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html). Inference runs inside a **Web Worker** (ONNX's WASM proxy mode), keeping the UI thread responsive.

The model is downloaded from the Hugging Face Hub on first use and cached by the browser; subsequent runs reuse the cached weights. Within a session, computed embeddings are also cached in memory (keyed by model ID and text content) so that re-running alignment after minor edits only recomputes the embeddings that actually changed. Texts are truncated to 1 500 characters before being passed to the tokeniser, matching the ~512-token limit of these models. Embeddings are computed in batches of 32, with mean pooling and L2 normalisation applied to the output.

**2. Alignment via dynamic programming**

Once all embeddings are ready, pairwise [cosine similarity](https://en.wikipedia.org/wiki/Cosine_similarity) is computed between every element of document A and every element of document B, producing an *n × m* similarity matrix.

The optimal order-preserving (monotone) alignment is then found with a [Needleman–Wunsch](https://en.wikipedia.org/wiki/Needleman%E2%80%93Wunsch_algorithm)-style dynamic-programming algorithm: it maximises the total cosine similarity while guaranteeing that if A[i] maps to B[j] and A[i′] maps to B[j′] with i′ > i, then j′ > j. The gap penalty is 0, so unmatched elements are silently skipped rather than penalised. Any candidate pair whose similarity falls below the threshold of **0.2** is discarded. The algorithm runs in O(n × m) time and space, which is practical for documents up to roughly 200 elements per side.

**3. Output**

Each surviving pair is added to the project as a `Semantic` alignment, writing a `<link>` element into the TEI `<standOff>` section.

#### Available models

All models are served from the [Hugging Face Hub](https://huggingface.co) in ONNX format by the [Xenova](https://huggingface.co/Xenova) organisation.

| Model | Size | Languages | Notes |
|-------|------|-----------|-------|
| [paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2) | ~120 MB | 50 | Fast; good default for most use cases |
| [multilingual-e5-small](https://huggingface.co/Xenova/multilingual-e5-small) | ~120 MB | 100 | Requires `"passage: "` prefix; broader language coverage |
| [multilingual-e5-base](https://huggingface.co/Xenova/multilingual-e5-base) | ~280 MB | 100 | Higher accuracy than E5 small at the cost of model size |
| [LaBSE](https://huggingface.co/Xenova/LaBSE) | ~500 MB | 109 | Best multilingual coverage; significantly larger download |

### `AutosaveButton`
Polls for unsaved changes every 500 ms, persists the full application state to `localStorage`, and offers a restore dialog on next load.

### `OpenSeaDragon`
Zoomable image viewer with support for direct image URLs and IIIF tile sources.

### `ExistDBSync`
Dialog for configuring eXistDB credentials, listing collections, and loading or saving TEI files.

### `ViewerCode`
Generates self-contained HTML files embedding the TEI data and a `tei-alignment-viewer` Web Component for distribution without a server.

---

## Alignment Graph in TEI standOff

All alignment data is stored inside the `<standOff>` element of the TEI file according to the [TEI standOff markup](https://www.tei-c.org/release/doc/tei-p5-doc/en/html/SA.html#SASO) specification. This section explains how the data model maps to a graph of translations.

### Nodes

Every text element that participates in an alignment must carry an `xml:id` attribute. This applies to the standard TEI text-bearing elements (`<p>`, `<l>`, `<ab>`, `<head>`, `<seg>`, `<w>`, etc.). An element's `xml:id` is its node identifier in the graph.

### Simple edges — `<link>`

The fundamental alignment unit is a `<link>` element carrying two space-separated fragment references in its `target` attribute and an optional `type` label (the alignment category):

```xml
<standOff>
  <linkGrp type="translation">
    <link target="#it-p-1 #de-p-1" type="Semantic"/>
    <link target="#it-p-2 #de-p-2" type="Literal"/>
  </linkGrp>
</standOff>
```

Each `<link>` is a directed edge from the first ID to the second ID. Because the viewer resolves them bidirectionally, the graph is effectively undirected for display purposes.

### Grouped nodes — `<join>`

When an alignment spans more than one element on either side (e.g. two Italian lines that together correspond to a single German stanza), the individual IDs are first collected into a named `<join>` element and the `<link>` then points to the join:

```xml
<standOff>
  <!-- Group two Italian lines into a single logical node -->
  <join xml:id="join1" target="#it-l-1 #it-l-2" type="Semantic"/>

  <linkGrp type="translation">
    <!-- One German line aligns with the Italian pair -->
    <link target="#join1 #de-l-1" type="Semantic"/>
  </linkGrp>
</standOff>
```

Clicking any of the Italian lines in the viewer highlights all segments in the join plus the German partner, and vice versa.

### Multi-language pairs

Each ordered pair of languages produces its own `<linkGrp type="translation">`. A project with three languages (e.g. Italian, German, English) can therefore hold up to three independent `<linkGrp>` blocks — one per aligned pair — inside the same `<standOff>`:

```xml
<standOff>
  <linkGrp type="translation">  <!-- it ↔ de -->
    <link target="#it-p-1 #de-p-1" type="Semantic"/>
  </linkGrp>
  <linkGrp type="translation">  <!-- it ↔ en -->
    <link target="#it-p-1 #en-p-1" type="Literal"/>
  </linkGrp>
</standOff>
```

### Runtime graph resolution

When the viewer loads the TEI file, `teiViewerCore.processAlignments()` builds two in-memory maps:

1. **`joinMap`** — resolves each `<join>` ID to the list of constituent segment IDs.
2. **`linkMap`** — a `Map<segId, Set<segId>>` built by expanding every `<link>` (after join resolution) into bidirectional entries. Same-side siblings within a join are also cross-linked so that clicking any member of a group highlights all of them.
3. **`colorMap`** — assigns a consistent highlight colour to each segment ID, cycling through a fixed palette, so that corresponding segments on both sides share the same visual cue.

The resulting structure is effectively a **labelled multigraph**: nodes are `xml:id`-bearing TEI elements, edges are `<link>` elements labelled with alignment categories, and super-nodes are `<join>` groups.

### Alignment categories

| Value | Meaning |
|-------|---------|
| `Linguistic` | Structurally parallel (same syntactic role) |
| `Semantic` | Same meaning, different form |
| `Literal` | Word-for-word translation |
| `Other` | Any other correspondence |

---

## Technology Stack

| Layer | Library / Tool |
|-------|---------------|
| UI framework | React 18, Material-UI 5 |
| XML editor | Monaco Editor (`@monaco-editor/react`) |
| AI/ML | Transformers.js (`@xenova/transformers`) — ONNX models |
| Image viewer | OpenSeaDragon 4 |
| Web Components | Lit 3 |
| Proxy server | Koa 2, `@koa/router`, `@koa/cors` |
| Onboarding | driver.js (CDN) |


---

## TEI Data Model

Generated TEI files follow this structure:

```
<TEI xmlns="http://www.tei-c.org/ns/1.0">
  <teiHeader>          ← project metadata (title, authors, languages, …)
  <standOff>           ← alignment links (<linkGrp>, <link>, <join>)
  <text>               ← one <body> per language with <seg xml:id="…"> elements
</TEI>
```

Alignment links use the `target="#id1 #id2"` convention; tokenised words are wrapped in `<w>` elements after the tokenisation step.

---

## License

DiScEPT is developed at the [Istituto Italiano di Studi Germanici](https://www.studigermanici.it/).
