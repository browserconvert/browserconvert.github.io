<div align="center">

# ⇄ BrowserConvert
### Universal Local File Converter • 100% Client-Side Browser RAM Engine

[![Live Demo](https://img.shields.io/badge/Live%20Demo-browserconvert.github.io-CB2957?style=for-the-badge&logo=google-chrome&logoColor=white)](https://browserconvert.github.io/)
[![Astro](https://img.shields.io/badge/Astro%205-Islands%20Architecture-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Zero%20Cloud%20Uploads-emerald?style=for-the-badge&logo=shield&logoColor=white)](https://browserconvert.github.io/)
[![PWA](https://img.shields.io/badge/PWA-100%25%20Offline%20Ready-0052CC?style=for-the-badge&logo=pwa&logoColor=white)](https://browserconvert.github.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-black?style=for-the-badge&logo=open-source-initiative&logoColor=white)](LICENSE)
[![Support](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-CB2957?style=for-the-badge&logo=gumroad&logoColor=white)](https://kisharadilshan.gumroad.com/coffee)

<p align="center">
  <b>Convert Videos, Audio, Images, Apple HEIC, PDF, Word &amp; Spreadsheets completely inside your web browser.</b><br/>
  Zero server uploads • Unlimited file size • Native CPU/GPU WebAssembly speed • Total privacy.
</p>

[**Launch BrowserConvert**](https://browserconvert.github.io/) • [**Support the Developer**](https://kisharadilshan.gumroad.com/coffee) • [**Report Issue**](https://github.com/browserconvert/browserconvert.github.io/issues)

</div>

---

## 📖 Executive Summary & Zero-Server Privacy Architecture

Traditional online converters such as **CloudConvert, FreeConvert, Convertio, Zamzar, and AnyConv** operate on a centralized client-server architecture: you must upload your personal or proprietary files across the public internet to third-party servers, wait in processing queues, and download the converted output. This introduces serious privacy risks, security vulnerabilities, 50MB–100MB paywalled file size restrictions, and heavy bandwidth consumption.

**BrowserConvert fundamentally reimagines file conversion** through **100% Client-Side WebAssembly & Web Worker execution**:

```
[ User Device / Browser RAM ]
      │
      ├── Drop File (e.g., MP4, MOV, HEIC, PDF, CSV)
      │
      ├── WebAssembly Engine Execution:
      │     ├─ Video & Audio: In-Browser FFmpeg Wasm Transcoder
      │     ├─ Images & HEIC: Wasm HEIC Container Decoder + HTML5 Canvas 2D
      │     ├─ Documents & PDF: Vector parsing via pdf-lib, mammoth & docx
      │     └─ Spreadsheets: In-Memory SheetJS binary parsing (CSV/XLSX/JSON)
      │
      └── Instant Downloadable Blob (0 Bytes uploaded to any cloud server)
```

1. **Zero Cloud Uploads**: Files are read directly into browser RAM and transcode buffers. No remote servers, no temporary cloud storage, no access logs.
2. **Unlimited File Size**: Because execution happens locally on your machine, you are never restricted by arbitrary 100MB server upload caps or paywalls. Convert 1GB+ videos with native CPU speed.
3. **True Offline Functionality**: Delivered as a Progressive Web App (PWA). Once loaded, BrowserConvert works seamlessly in Airplane Mode or offline environments.
4. **Instant 1-Click Demo**: Test conversions in zero clicks using our in-memory synthetic sample file generator.

---

## 🗂️ Supported Conversion Matrix

BrowserConvert supports high-fidelity bidirectional conversion across 5 major categories:

| Category | Supported Formats | Engine & Underlying Technology |
| :--- | :--- | :--- |
| **Video** | `MP4`, `MOV`, `WEBM`, `MKV`, `AVI`, `M4V`, `GIF` | Lazy-loaded `@ffmpeg/ffmpeg` WebAssembly + Libx264 / AAC |
| **Audio** | `MP3`, `M4A`, `WAV`, `AAC`, `OGG`, `FLAC` | FFmpeg Wasm Audio Transcoder (128k, 192k, 320kbps bitrate control) |
| **Image** | `HEIC`, `JPG`, `PNG`, `WEBP`, `SVG`, `GIF`, `ICO` | Dynamic `heic2any` Wasm decoder + HTML5 Canvas pixel pipeline |
| **Document** | `PDF`, `DOCX (Word)`, `TXT`, `HTML` | `pdf-lib` vector synthesis + `mammoth` & `docx` OpenXML parser |
| **Spreadsheet** | `CSV`, `XLSX`, `JSON` | SheetJS (`xlsx`) in-memory table and binary transformer |

---

## 🎨 UI/UX Design System & Theme Tokens

The design system is engineered around high accessibility, clean minimalist surfaces, and oversized touch targets (48x48px on mobile).

| Token Name | Hex Value | Semantic Usage in UI |
| :--- | :--- | :--- |
| **Pure Obsidian Black** | `#000000` | Dark mode primary background, CloudConvert-style signature format cards |
| **Crimson Ruby Accent** | `#CB2957` | Primary action buttons, active badges, progress bars, brand glyphs |
| **Structural Silver Gray** | `#DDDDDD` | Borders, subtle dividers, secondary surface pills |
| **Clean Alabaster Surface** | `#EEEEEE` | Light mode primary background, clean dropzone surface |

### Signature Two-Button Format Hub
Located inside the top of the Hero Workspace:
`[ Convert: MP4 v ]  ⇄  [ To: MP3 v ]`
- Click either box to launch the **Mega-Dropdown Popover** featuring a search input, category filters (*Video, Audio, Image, Document, Spreadsheet*), and interactive format pills.
- 1-Click swap button in the center instantly flips source and target formats.
- **Smart Auto-Detect**: Dropping files automatically inspects extensions and suggests optimal target formats (e.g., `.mov` → `MP4`, `.heic` → `JPG`, `.pdf` → `DOCX`, `.csv` → `XLSX`).

---

## 🌐 8-Language Internationalization (i18n)

BrowserConvert delivers 100% native translations across 8 major world languages:

- 🇺🇸 **English (`/`)**
- 🇪🇸 **Español (`/es/`)**
- 🇧🇷 **Português (`/pt/`)**
- 🇩🇪 **Deutsch (`/de/`)**
- 🇫🇷 **Français (`/fr/`)**
- 🇯🇵 **日本語 (`/ja/`)**
- 🇨🇳 **简体中文 (`/zh/`)**
- 🇷🇺 **Русский (`/ru/`)**

Every route includes automated canonical self-references and full bidirectional `<link rel="alternate" hreflang="..." />` tags with `x-default` fallback.

---

## ⚡ Technical SEO & Google Rich Snippets Architecture

- **100/100 Technical SEO**: Strict semantic HTML5 (`<header>`, `<main>`, `<section>`, `<nav aria-label="Breadcrumb">`, `<details>`, `<footer>`).
- **Google Analytics Integration**: Official Global Site Tag (`G-NKGMC4GRGT`) injected in `<head>` across all 8 locales.
- **Google Rich Results JSON-LD (Strictly zero fake ratings or reviews)**:
  - `WebApplication`: Identifies category (*UtilitiesApplication, MultimediaApplication*), requires HTML5/Wasm, free offer ($0.00).
  - `BreadcrumbList`: Dynamic breadcrumbs matching user language paths.
  - `FAQPage`: Schema populated from the 8-language FAQ matrix answering competitor comparison and privacy questions.
- **33-Keyword Target Matrix**: Naturally integrated across metadata, below-the-fold headings, 1-Click Popular Conversions grid, and security comparison table (*"Is CloudConvert Safe?"*).
- **Auto-Generated Sitemaps**: Powered by `@astrojs/sitemap` creating `sitemap-index.xml` and `sitemap-0.xml` on build.

---

## 📲 Progressive Web App (PWA) & Offline Capability

- **`manifest.webmanifest`**: Standalone display mode with `#CB2957` theme color and responsive maskable icons.
- **`sw.js` Service Worker**: Pre-caches all HTML language routes, Vite bundles, CSS, and WebAssembly modules.
- **Add to Home Screen**:
  - Automatically captures `beforeinstallprompt` on Android, Chrome, and Edge.
  - Includes a custom step-by-step visual guidance modal for iOS Safari users (*"Tap Share → Add to Home Screen"*).

---

## 💻 Local Development & Build

### Prerequisites
- Node.js `v18.0.0+` or `v20+` / `v24+`
- npm `v9+` or `v11+`

```bash
# 1. Clone repository
git clone https://github.com/browserconvert/browserconvert.github.io.git
cd browserconvert.github.io

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start local development server
npm run dev

# 4. Compile production static bundle for GitHub Pages
npm run build

# 5. Preview production build locally
npm run preview
```

---

## 🚀 GitHub Actions Continuous Deployment

The repository includes automated CI/CD via `.github/workflows/deploy.yml`:
- Triggers on every push to `main`.
- Builds static Astro output using `withastro/action@v3`.
- Deploys static artifacts directly to GitHub Pages via `actions/deploy-pages@v4`.
- `public/.nojekyll` prevents GitHub Pages Jekyll from filtering `_astro/` asset directories.

---

## ☕ Support the Developer

BrowserConvert is free, open-source, and dedicated to online privacy and client-side web computing. If this tool saves you time, bandwidth, or subscription costs, consider supporting development:

[![Support the Developer](https://img.shields.io/badge/Support-Buy%20Me%20a%20Coffee-CB2957?style=for-the-badge&logo=gumroad&logoColor=white)](https://kisharadilshan.gumroad.com/coffee)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.  
Copyright (c) 2026 Kishara Dilshan / PixelPieStudio.
