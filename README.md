# DiScEPT

```markdown
# Discept UI

**Discept UI** is a React-based frontend application designed to work with TEI (Text Encoding Initiative) files, providing features for displaying and editing these files, as well as future integration with IIIF image sources.

## Key Components

### 1. **CETEIWrapper**
   - Renders **TEI XML documents** as HTML using `CETEIHelper`.
   - This component is used to display TEI files in a human-readable format.
   - It allows for the visualization of TEI documents in the frontend interface.

### 2. **OpenSeaDragon**
   - A component for displaying **zoomable images**, with future support for **IIIF** (International Image Interchange Format) sources.
   - Currently handles standard image URLs, with future plans to support IIIF-compliant image tiles for better integration with high-resolution image displays.

### 3. **AutomagicButton (BertAlign)**
   - A button for performing **AI-powered document alignment**.
   - It uses the BertAlign service to align two documents (languages) by sending their contents to a backend for processing.
   - The button shows a loading indicator while the AI alignment is in progress.

## Running the Software Locally

To run **Discept UI** on your local machine, follow these steps:


### Install dependencies

```bash
npm install
```

### Run the application

```bash
npm start
```

This will start the development server, and you can open the application in your browser at [http://localhost:3000](http://localhost:3000).
```

