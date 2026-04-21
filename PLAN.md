# Azure Vision API — Azure AI Demo

## Overview

A touch-first demo app showcasing Azure AI Vision (Image Analysis 4.0) capabilities,
built for use with the [Demo Kiosk](https://github.com/jenschristianschroder/demo-kiosk).

Follows the identical architecture, UI theme, project structure, infra patterns,
and CI/CD workflows established by the existing demo repos:

- [demo-realtime-gpt](https://github.com/jenschristianschroder/demo-realtime-gpt)
- [demo-text-understanding](https://github.com/jenschristianschroder/demo-text-understanding)
- [demo-speech-service](https://github.com/jenschristianschroder/demo-speech-service)

---

## Architecture Summary (matched from reference repos)

### Frontend (SPA)

| Aspect          | Detail                                                                 |
|-----------------|------------------------------------------------------------------------|
| Stack           | React 19 + TypeScript + Vite                                           |
| Routing         | react-router-dom — 3-screen flow: `/` → `/features` → `/demo/:feature`|
| Layout          | Kiosk-first: 480px max-width, centered, white bg `#ffffff`, black text `#111111` |
| CSS             | Hand-written CSS per page — no CSS framework                           |
| Touch           | `user-select: none`, `overscroll-behavior: none`, `-webkit-tap-highlight-color: transparent`, min-height 44px on all interactive |
| Iframe          | `Content-Security-Policy: frame-ancestors *` via nginx header          |
| Logo            | `/images/Microsoft-logo_rgb_c-gray.png` on WelcomeScreen              |
| Footer          | Microsoft Innovation Hub Denmark fixed at bottom of WelcomeScreen      |

### Backend (API)

| Aspect          | Detail                                                                 |
|-----------------|------------------------------------------------------------------------|
| Stack           | Express.js + TypeScript                                                |
| Port            | 3001                                                                   |
| Auth            | User-Assigned Managed Identity via `@azure/identity` `DefaultAzureCredential` — no API keys deployed |
| Routes          | `/api/vision/*` (feature-specific), `/health/ready`, `/health/live`    |
| CORS            | `cors({ origin: CORS_ORIGIN })` with `CORS_ORIGIN=*` default          |
| Body limit      | `express.json({ limit: '10mb' })` (images can be large)               |
| Azure SDK       | `@azure-rest/ai-vision-image-analysis` for Image Analysis 4.0 REST API |

### Communication Pattern

Unlike the Realtime GPT demo (which uses WebSocket relay), Vision API is **request-response**:

```
Browser (React SPA)
    ↕ REST POST /api/vision/:feature
Express API (Node.js)
    ↕ REST (HTTPS)
Azure AI Vision API (Image Analysis 4.0)
```

- User selects/drops/captures an image in the browser
- SPA sends image as `multipart/form-data` or base64 JSON to the API
- API authenticates with Managed Identity and calls Azure AI Vision
- API returns structured results (captions, tags, objects, OCR text, etc.)
- SPA renders results with overlays, bounding boxes, or text panels

### Containers

| Container | Build                          | Port | Notes                                    |
|-----------|--------------------------------|------|------------------------------------------|
| SPA       | node:20-alpine → nginx:alpine | 80   | Multi-stage; nginx serves static + proxies `/api/` and `/health/` to API |
| API       | node:20-alpine → node:20-alpine | 3001 | Multi-stage; runtime `node dist/index.js`|

### Infrastructure (Bicep)

```
infra/
├── main.bicep              # Orchestrator — params, derived names, module wiring
├── main.bicepparam         # Parameter file
└── modules/
    ├── acr.bicep           # Azure Container Registry (Basic SKU)
    ├── aca-environment.bicep # Container Apps Environment + Log Analytics
    ├── aca-api.bicep       # API Container App (internal ingress, port 3001)
    ├── aca-spa.bicep       # SPA Container App (external ingress, port 80)
    └── identity.bicep      # User-Assigned Managed Identity + role assignments
```

| Resource             | Config                                                            |
|----------------------|-------------------------------------------------------------------|
| API Container App    | 0.25 CPU, 0.5Gi, minReplicas=1, maxReplicas=3, internal ingress  |
| SPA Container App    | 0.25 CPU, 0.5Gi, minReplicas=0, maxReplicas=3, external ingress  |
| Managed Identity     | **Cognitive Services User** role on Azure AI Vision resource + **AcrPull** on ACR |

### CI/CD (GitHub Actions)

File: `.github/workflows/deploy.yml`

Trigger: `push` to `main` + `workflow_dispatch`

Permissions: `id-token: write`, `contents: read`

```
env:
  APP_NAME: vision-api
```

Steps:
1. Checkout
2. Azure Login (OIDC — federated credential)
3. Ensure Resource Group exists
4. Deploy Bicep (infra — placeholder images)
5. Handle MANIFEST_UNKNOWN bootstrap failures gracefully
6. Resolve ACR login server
7. ACR Login
8. Build & push API image → `{acr}/{APP_NAME}-api:{sha}`
9. Build & push SPA image → `{acr}/{APP_NAME}-spa:{sha}`
10. Update API Container App with new image (`--min-replicas 1`)
11. Update SPA Container App with new image (`--min-replicas 1`)
12. Output SPA URL

### GitHub Secrets

| Secret                       | Required | Description                                      |
|------------------------------|----------|--------------------------------------------------|
| AZURE_CLIENT_ID              | ✅       | App registration (service principal) client ID for OIDC |
| AZURE_TENANT_ID              | ✅       | Azure AD tenant ID                               |
| AZURE_SUBSCRIPTION_ID        | ✅       | Azure subscription ID                            |
| AZURE_RESOURCE_GROUP         | ✅       | Target resource group name                       |
| AZURE_VISION_ENDPOINT        | ✅       | Azure AI Vision endpoint URL (e.g. `https://<resource>.cognitiveservices.azure.com`) |
| AZURE_VISION_RESOURCE_ID     | ⚠️ Recommended | Full Azure resource ID for Managed Identity role assignment |

### GitHub Variables

| Variable       | Description                                       |
|----------------|---------------------------------------------------|
| AZURE_LOCATION | Azure region for resource group (e.g. swedencentral) |

---

## Project Structure

```
├── src/                          # SPA (React + Vite) source
│   ├── pages/
│   │   ├── WelcomeScreen.tsx     # Landing page with Microsoft logo + CTA
│   │   ├── WelcomeScreen.css
│   │   ├── FeaturesScreen.tsx    # Feature card grid — selects a demo
│   │   ├── FeaturesScreen.css
│   │   ├── DemoScreen.tsx        # Dynamic demo host — loads per-feature component
│   │   ├── DemoScreen.css
│   │   └── demos/                # One component per feature
│   │       ├── ImageCaptioningDemo.tsx
│   │       ├── DenseCaptionsDemo.tsx
│   │       ├── ObjectDetectionDemo.tsx
│   │       ├── ImageTaggingDemo.tsx
│   │       ├── SmartCropDemo.tsx
│   │       ├── OcrTextDemo.tsx
│   │       ├── ReceiptLabelDemo.tsx
│   │       ├── DiagramWhiteboardDemo.tsx
│   │       ├── BrandSafetyDemo.tsx
│   │       ├── FaceDetectionDemo.tsx
│   │       ├── AltTextDemo.tsx
│   │       ├── ImageSearchDemo.tsx
│   │       └── VideoFrameAnalysisDemo.tsx
│   ├── components/               # Shared UI components
│   │   ├── ImageUploader.tsx     # Drag-drop / file picker / camera capture
│   │   ├── ImageUploader.css
│   │   ├── ImageCanvas.tsx       # Canvas overlay for bounding boxes / regions
│   │   ├── ImageCanvas.css
│   │   ├── ConfidenceBadge.tsx   # Confidence score pill (colored by threshold)
│   │   └── SampleImagePicker.tsx # Grid of preloaded sample images
│   ├── hooks/
│   │   └── useVisionAnalysis.ts  # Shared hook: upload image → call API → return results
│   ├── services/
│   │   └── visionClient.ts      # REST client for /api/vision/* endpoints
│   ├── App.tsx                   # Router
│   ├── index.css                 # Global kiosk styles (identical to reference repos)
│   ├── main.tsx                  # Entry point (BrowserRouter + StrictMode)
│   ├── types.ts                  # Feature types + FEATURES array
│   └── vite-env.d.ts
├── services/api/                 # Express API backend
│   ├── src/
│   │   ├── index.ts              # Express app — mounts routes, health
│   │   ├── visionClient.ts      # Azure AI Vision auth via DefaultAzureCredential
│   │   └── routes/
│   │       ├── health.ts         # /health/ready, /health/live
│   │       └── vision.ts         # /api/vision/analyze — main analysis endpoint
│   ├── Dockerfile                # Multi-stage Node build
│   ├── package.json
│   └── tsconfig.json
├── infra/                        # Azure Bicep IaC
│   ├── main.bicep
│   ├── main.bicepparam
│   └── modules/
│       ├── acr.bicep
│       ├── aca-environment.bicep
│       ├── aca-api.bicep
│       ├── aca-spa.bicep
│       └── identity.bicep
├── public/
│   ├── images/
│   │   ├── Microsoft-logo_rgb_c-gray.png
│   │   └── vision-api-thumbnail.png     # For kiosk registry
│   └── samples/                         # Preloaded sample images for demos
│       ├── street-scene.jpg
│       ├── receipt.jpg
│       ├── whiteboard.jpg
│       ├── product-label.jpg
│       ├── people-group.jpg
│       ├── brand-logos.jpg
│       ├── handwritten-note.jpg
│       ├── architecture-diagram.jpg
│       └── gallery/                     # Multiple images for search demo
│           ├── img-01.jpg … img-12.jpg
├── .github/workflows/
│   └── deploy.yml
├── Dockerfile                    # SPA multi-stage (Node → nginx)
├── nginx.conf                    # SPA serving + API proxy
├── docker-compose.yml
├── .env.example
├── .dockerignore
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
├── eslint.config.js
├── index.html
├── LICENSE                       # MIT
└── README.md
```

---

## Features (13 Demos)

Each demo is a `VisionFeature` type and has its own component under `src/pages/demos/`.

```typescript
// src/types.ts
export type VisionFeature =
  | 'imageCaptioning'
  | 'denseCaptions'
  | 'objectDetection'
  | 'imageTagging'
  | 'smartCrop'
  | 'ocrText'
  | 'receiptLabel'
  | 'diagramWhiteboard'
  | 'brandSafety'
  | 'faceDetection'
  | 'altText'
  | 'imageSearch'
  | 'videoFrameAnalysis';

export interface FeatureInfo {
  id: VisionFeature;
  label: string;
  description: string;
}

export const FEATURES: FeatureInfo[] = [
  {
    id: 'imageCaptioning',
    label: 'Image Captioning',
    description: 'Generate a natural language caption with confidence score',
  },
  {
    id: 'denseCaptions',
    label: 'Dense Captions',
    description: 'Get region-level captions for every detected area in the image',
  },
  {
    id: 'objectDetection',
    label: 'Object Detection',
    description: 'Detect objects and draw labeled bounding boxes on a canvas',
  },
  {
    id: 'imageTagging',
    label: 'Image Tagging',
    description: 'Extract the top content tags with confidence scores',
  },
  {
    id: 'smartCrop',
    label: 'Smart Crop Suggestions',
    description: 'Get auto-generated crop regions for different aspect ratios',
  },
  {
    id: 'ocrText',
    label: 'OCR – Text Extraction',
    description: 'Extract printed and handwritten text with position overlay',
  },
  {
    id: 'receiptLabel',
    label: 'Receipt & Label Reading',
    description: 'OCR with lightweight post-parsing for structured receipt data',
  },
  {
    id: 'diagramWhiteboard',
    label: 'Diagram / Whiteboard OCR',
    description: 'Extract text lines from diagrams, whiteboards, and sketches',
  },
  {
    id: 'brandSafety',
    label: 'Brand & Content Safety',
    description: 'Detect adult, racy, and gory content with confidence signals',
  },
  {
    id: 'faceDetection',
    label: 'Face Detection',
    description: 'Detect faces and render bounding boxes (no identification)',
  },
  {
    id: 'altText',
    label: 'Alt-Text Generator',
    description: 'Compose accessible alt-text from caption and tags',
  },
  {
    id: 'imageSearch',
    label: 'Image Search by Tags',
    description: 'Search and filter a local gallery using auto-generated tags',
  },
  {
    id: 'videoFrameAnalysis',
    label: 'Video Frame Analysis',
    description: 'Sample frames from a video and run per-frame image analysis',
  },
];
```

---

## Detailed Demo Specifications

### 1. Image Captioning

Component: `ImageCaptioningDemo.tsx`

**UX Flow:**
1. User uploads or selects a sample image
2. Image displayed in the main area
3. API returns a single caption with confidence score
4. Caption displayed below the image in a styled card
5. Confidence badge shows score (green ≥ 0.8, yellow ≥ 0.5, red < 0.5)

**UI Elements:**
- `ImageUploader` component (drag-drop zone + file picker + camera button)
- `SampleImagePicker` row of thumbnails for quick selection
- Image display area (max-width 480px, responsive)
- Caption card: `"A person walking a dog in a park"` with confidence `0.92`
- Loading spinner during analysis

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['caption'] }
Response: { caption: { text: string, confidence: number } }
```

**Azure Vision Features Used:** `caption`

---

### 2. Dense Captions

Component: `DenseCaptionsDemo.tsx`

**UX Flow:**
1. User uploads image
2. Image displayed on a `<canvas>`
3. API returns array of region-level captions with bounding boxes
4. Bounding boxes drawn on the canvas with numbered labels
5. Caption list below canvas — hover/tap a caption highlights its box

**UI Elements:**
- `ImageUploader`
- `ImageCanvas` with bounding box overlays (semi-transparent colored rectangles)
- Numbered caption list below — each with region text + confidence
- Tap a caption → its bounding box pulses/highlights on canvas
- Tap a bounding box → scrolls to and highlights the caption

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['denseCaptions'] }
Response: { denseCaptions: [{ text: string, confidence: number, boundingBox: {x,y,w,h} }] }
```

**Azure Vision Features Used:** `denseCaptions`

---

### 3. Object Detection

Component: `ObjectDetectionDemo.tsx`

**UX Flow:**
1. User uploads image
2. Image rendered on a `<canvas>`
3. API returns detected objects with bounding boxes and labels
4. Bounding boxes drawn on canvas with labels and confidence scores
5. Color-coded by object category
6. Object count summary shown above canvas

**UI Elements:**
- `ImageUploader`
- `ImageCanvas` with labeled bounding boxes (colored borders, label tag at top-left of each box)
- Summary bar: "Detected 5 objects: 2 Person, 1 Car, 1 Dog, 1 Tree"
- Object list panel with confidence bars
- Toggle to show/hide bounding boxes

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['objects'] }
Response: { objects: [{ name: string, confidence: number, boundingBox: {x,y,w,h} }] }
```

**Azure Vision Features Used:** `objects`

---

### 4. Image Tagging

Component: `ImageTaggingDemo.tsx`

**UX Flow:**
1. User uploads image
2. Image displayed in main area
3. API returns top tags with confidence scores
4. Tags displayed as a cloud of pills/chips sorted by confidence
5. Each tag has a confidence bar or percentage

**UI Elements:**
- `ImageUploader`
- Image display
- Tag cloud: pills with tag name + confidence percentage
  - High confidence (≥ 0.8): solid black bg, white text
  - Medium (≥ 0.5): outlined, dark border
  - Low (< 0.5): light gray, smaller
- Sorted by confidence descending

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['tags'] }
Response: { tags: [{ name: string, confidence: number }] }
```

**Azure Vision Features Used:** `tags`

---

### 5. Smart Crop Suggestions

Component: `SmartCropDemo.tsx`

**UX Flow:**
1. User uploads image
2. Original image displayed
3. API returns smart crop regions for multiple aspect ratios (1:1, 16:9, 4:3, 9:16)
4. Crop regions shown as overlays on original image
5. Cropped previews rendered below for each aspect ratio
6. User can toggle between aspect ratios

**UI Elements:**
- `ImageUploader`
- Original image with dashed crop overlay for selected ratio
- Aspect ratio selector chips: `1:1` | `16:9` | `4:3` | `9:16`
- Cropped preview thumbnails in a row below
- Side-by-side comparison: original vs. cropped

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['smartCrops'], smartCropsAspectRatios: [1, 1.78, 1.33, 0.56] }
Response: { smartCrops: [{ aspectRatio: number, boundingBox: {x,y,w,h} }] }
```

**Azure Vision Features Used:** `smartCrops`

---

### 6. OCR – Printed and Handwritten Text

Component: `OcrTextDemo.tsx`

**UX Flow:**
1. User uploads an image containing text (printed or handwritten)
2. Image rendered on `<canvas>`
3. API returns detected text blocks, lines, and words with positions
4. Text regions highlighted on canvas with semi-transparent overlays
5. Extracted text shown in a scrollable text panel below
6. Toggle between "Overlay" view and "Text Only" view

**UI Elements:**
- `ImageUploader`
- `ImageCanvas` with word-level bounding polygons (blue outlines)
- Extracted text panel (monospace font, line-by-line)
- View toggle: `Overlay` | `Text Only`
- Copy button to copy extracted text to clipboard

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['read'] }
Response: { read: { blocks: [{ lines: [{ text: string, boundingPolygon: [...], words: [...] }] }] } }
```

**Azure Vision Features Used:** `read`

---

### 7. Receipt / Label Reading

Component: `ReceiptLabelDemo.tsx`

**UX Flow:**
1. User uploads a receipt or product label photo
2. Sample images include receipt, nutrition label, price tag
3. OCR extracts all text
4. Lightweight client-side post-parsing extracts structured fields:
   - For receipts: store name, date, line items, total
   - For labels: product name, ingredients, nutritional values
5. Raw OCR text on the left, parsed structure on the right

**UI Elements:**
- `ImageUploader` with receipt/label sample images
- Split layout:
  - Left: image with OCR overlay
  - Right: parsed data card with labeled fields
- Field cards: `Store: "Contoso Market"`, `Total: "$47.23"`, `Date: "2024-03-15"`
- "Raw Text" expandable section at bottom
- Parsing confidence indicator

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['read'] }
Response: { read: { ... } }
```
Client-side parsing logic extracts structured data from raw OCR lines.

**Azure Vision Features Used:** `read` + client-side post-parsing

---

### 8. Diagram / Whiteboard OCR

Component: `DiagramWhiteboardDemo.tsx`

**UX Flow:**
1. User uploads a whiteboard photo, flowchart, or hand-drawn diagram
2. Image displayed on canvas
3. OCR extracts text lines with spatial positions
4. Text blocks rendered as floating labels positioned over the image
5. Extracted text listed below in reading order

**UI Elements:**
- `ImageUploader` with whiteboard/diagram samples
- `ImageCanvas` with positioned text labels (floating badges over detected regions)
- Text list panel sorted by vertical position (reading order)
- Copy all text button
- Toggle: `Positioned Labels` | `Reading Order List`

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['read'] }
Response: { read: { ... } }
```

**Azure Vision Features Used:** `read`

---

### 9. Brand / Safe-Content Detection

Component: `BrandSafetyDemo.tsx`

**UX Flow:**
1. User uploads an image
2. API returns adult/racy/gory content classification with severity
3. Results shown as a safety dashboard with severity gauges
4. Green/yellow/red indicators for each category
5. Also shows detected category tags related to content

**UI Elements:**
- `ImageUploader`
- Image display (blurred if adult content detected, with "Reveal" button)
- Safety dashboard card:
  - `Adult:  ████░░░░░░  3/9 — Safe`
  - `Racy:   ██░░░░░░░░  1/9 — Safe`
  - `Gore:   ░░░░░░░░░░  0/9 — Safe`
- Severity gauge bars (green → yellow → red gradient)
- Overall verdict badge: `✅ Safe for all audiences` or `⚠️ Review recommended`

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['tags', 'caption'] }
Response: { tags: [...], caption: {...} }
```

Note: Image Analysis 4.0 does not expose adult/racy/gory scores directly via the
`@azure-rest/ai-vision-image-analysis` SDK in the same way as Computer Vision 3.2.
We use the Computer Vision 3.2 `analyze` endpoint for this specific demo to access
the `adult` category scores. The API route handles the version difference.

**Azure Vision Features Used:** Computer Vision 3.2 `adult` visual feature

---

### 10. Face Detection

Component: `FaceDetectionDemo.tsx`

**UX Flow:**
1. User uploads image with people
2. Image rendered on canvas
3. API returns face bounding boxes (no identification — privacy-safe)
4. Bounding boxes drawn around faces with numbering
5. Face count displayed prominently

**UI Elements:**
- `ImageUploader` with group photo samples
- `ImageCanvas` with face bounding boxes (blue rectangles, numbered)
- Face count badge: `👤 4 faces detected`
- Each face box has a subtle numbered label
- Note at bottom: "Face detection only — no identification or recognition"

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['people'] }
Response: { people: [{ boundingBox: {x,y,w,h}, confidence: number }] }
```

**Azure Vision Features Used:** `people`

---

### 11. Alt-Text Generation for Accessibility

Component: `AltTextDemo.tsx`

**UX Flow:**
1. User uploads image
2. API returns caption + tags
3. Client composes alt-text: combines caption with top 3-5 tags
4. Shows the generated alt-text in a preview card
5. Shows how it would render in HTML with `<img alt="...">` preview
6. Copy button for the alt-text

**UI Elements:**
- `ImageUploader`
- Image display
- Generated alt-text card with large readable text
- HTML preview: `<img src="..." alt="A person walking a dog in a park">`
- Building blocks shown: `Caption → Tags → Composed Alt-Text`
- Copy to clipboard button
- Accessibility score indicator (based on caption confidence + tag relevance)

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['caption', 'tags'] }
Response: { caption: {...}, tags: [...] }
```

**Azure Vision Features Used:** `caption` + `tags` (composed client-side)

---

### 12. Image Search Using Tags

Component: `ImageSearchDemo.tsx`

**UX Flow:**
1. On mount, a gallery of 12 sample images is displayed as a grid
2. All images are pre-analyzed (tags cached in state) or analyzed on first load
3. Search bar at top — user types a keyword (e.g., "car", "outdoor", "food")
4. Gallery filters in real-time to show only images matching the tag
5. Each image shows its top 3 tags as pills below the thumbnail
6. Tag suggestions appear as the user types (autocomplete from all discovered tags)

**UI Elements:**
- Search input with autocomplete dropdown
- Tag filter chips (click a tag to filter)
- Image grid (3 columns, responsive)
- Each card: thumbnail + tag pills + caption
- Loading skeletons while analyzing
- "Analyze All" button to batch-process all gallery images
- Match count: `Showing 4 of 12 images for "outdoor"`

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['tags', 'caption'] }
```
Called once per gallery image; results cached in React state.

**Azure Vision Features Used:** `tags` + `caption`

---

### 13. Video Frame Sampling with Per-Frame Analysis

Component: `VideoFrameAnalysisDemo.tsx`

**UX Flow:**
1. User uploads a short video (≤ 30s) or selects a sample
2. Client-side JavaScript extracts frames at configurable interval (e.g., every 2s)
3. Frame thumbnails shown in a filmstrip/timeline at bottom
4. Each frame is sent to the Vision API for analysis
5. Results per frame: caption + detected objects + tags
6. Tap a frame to see full analysis detail
7. Summary panel: "Objects seen across frames" aggregated view

**UI Elements:**
- Video upload area (accepts `.mp4`, `.webm`)
- Sample video selector
- Frame interval selector: `Every 1s` | `Every 2s` | `Every 5s`
- Filmstrip timeline at bottom (scrollable horizontal strip)
- Each frame: thumbnail + mini caption
- Detail panel when frame selected: full caption, objects, tags
- Aggregated summary: "Across 15 frames: Person (15), Car (8), Dog (3)"
- Progress bar during batch analysis

**API Call:**
```
POST /api/vision/analyze
Body: { image: <base64>, features: ['caption', 'tags', 'objects'] }
```
Called once per extracted frame. Frames extracted client-side using `<video>` + `<canvas>`.

**Azure Vision Features Used:** `caption` + `tags` + `objects` (per frame)

---

## Shared Components

### ImageUploader

Reusable image input component used by all 13 demos.

```typescript
interface ImageUploaderProps {
  onImageSelected: (imageData: string, file: File) => void; // base64 data URL
  accept?: string;           // default: 'image/*'
  showCamera?: boolean;      // show camera capture button (default: true)
  showSamples?: boolean;     // show sample image picker (default: true)
  sampleImages?: string[];   // paths to sample images
  maxSizeMB?: number;        // max file size in MB (default: 4)
}
```

Features:
- Drag-and-drop zone with dashed border
- File picker button
- Camera capture button (uses `navigator.mediaDevices.getUserMedia`)
- Paste from clipboard support
- Image preview after selection
- File size validation
- Resize large images client-side before upload

### ImageCanvas

Canvas component for rendering images with overlays.

```typescript
interface ImageCanvasProps {
  imageSrc: string;
  boundingBoxes?: BoundingBox[];
  regions?: Region[];
  textOverlays?: TextOverlay[];
  highlightIndex?: number;
  onBoxClick?: (index: number) => void;
  showLabels?: boolean;
}
```

Features:
- Scales image to fit container while maintaining aspect ratio
- Draws bounding boxes with labels and confidence
- Color palette for different categories
- Highlight/pulse animation on selected box
- Tap interaction to select a box
- Responsive redraw on resize

### ConfidenceBadge

```typescript
interface ConfidenceBadgeProps {
  score: number;   // 0–1
  label?: string;
}
```

- Score ≥ 0.8 → green pill
- Score ≥ 0.5 → yellow pill
- Score < 0.5 → red pill

---

## Shared Frontend Hook: `useVisionAnalysis`

All 13 demos share a common React hook for image analysis:

```typescript
// src/hooks/useVisionAnalysis.ts
interface UseVisionAnalysisOptions {
  features: string[];                    // e.g. ['caption', 'tags', 'objects']
  smartCropsAspectRatios?: number[];     // for smart crop demo
}

interface UseVisionAnalysisReturn {
  analyze: (imageBase64: string) => Promise<VisionResult>;
  isLoading: boolean;
  result: VisionResult | null;
  error: string | null;
  reset: () => void;
}

interface VisionResult {
  caption?: { text: string; confidence: number };
  denseCaptions?: Array<{ text: string; confidence: number; boundingBox: BoundingBox }>;
  objects?: Array<{ name: string; confidence: number; boundingBox: BoundingBox }>;
  tags?: Array<{ name: string; confidence: number }>;
  read?: ReadResult;
  people?: Array<{ boundingBox: BoundingBox; confidence: number }>;
  smartCrops?: Array<{ aspectRatio: number; boundingBox: BoundingBox }>;
  adult?: { isAdultContent: boolean; isRacyContent: boolean; isGoryContent: boolean;
            adultScore: number; racyScore: number; goreScore: number };
}
```

---

## Backend API Design

### Single Analysis Endpoint

```
POST /api/vision/analyze
Content-Type: application/json

Body:
{
  "image": "<base64-encoded image data>",
  "features": ["caption", "tags", "objects", "read", "denseCaptions", "people", "smartCrops"],
  "smartCropsAspectRatios": [1.0, 1.78]   // optional
}

Response: VisionResult (see above)
```

The API backend:
1. Receives the base64 image from the SPA
2. Authenticates with Azure AI Vision using `DefaultAzureCredential`
3. Calls Azure AI Vision Image Analysis 4.0 API
4. Returns structured results

### Adult Content Endpoint (Computer Vision 3.2)

```
POST /api/vision/adult
Content-Type: application/json

Body:
{
  "image": "<base64-encoded image data>"
}

Response:
{
  "adult": { isAdultContent, isRacyContent, isGoryContent, adultScore, racyScore, goreScore }
}
```

Uses the older Computer Vision 3.2 REST API directly for the `adult` visual feature,
which is not available in Image Analysis 4.0.

### Health Routes

```
GET /health/ready → { status: 'ok' }
GET /health/live  → { status: 'ok' }
```

---

## Environment Variables

### `.env.example`

```
# Azure AI Vision (used by the API service, not the SPA)
AZURE_VISION_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com
```

### API Container App env vars (set via Bicep)

```
PORT=3001
AZURE_VISION_ENDPOINT=<from Bicep param>
AZURE_CLIENT_ID=<managed identity client ID>
CORS_ORIGIN=*
```

---

## Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
```

---

## Docker Compose (local dev)

```yaml
services:
  vision-api-spa:
    build: .
    ports:
      - "3000:80"
    environment:
      - API_BACKEND_URL=http://vision-api-api:3001
    depends_on:
      - vision-api-api

  vision-api-api:
    build: ./services/api
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - AZURE_VISION_ENDPOINT=${AZURE_VISION_ENDPOINT}
      - CORS_ORIGIN=*
```

---

## Key Dependencies

### SPA (`package.json`)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.0"
  }
}
```

No additional SDKs — image handling via native browser APIs (FileReader, Canvas, Video).

### API (`services/api/package.json`)

```json
{
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "@azure/identity": "^4.5.0",
    "@azure-rest/ai-vision-image-analysis": "^1.0.0-beta.3",
    "multer": "^1.4.5-lts.1"
  }
}
```

---

## UI Theme Reference (exact match to existing repos)

### Colors

| Token          | Value     | Usage                                    |
|----------------|-----------|------------------------------------------|
| Background     | `#ffffff` | Page background                          |
| Primary text   | `#111111` | Titles, labels, body text                |
| Secondary text | `#666666` | Subtitles, descriptions                  |
| Muted text     | `#999999` | Placeholders, footer                     |
| Accent         | `#0078d4` | Focus states, links, overlay borders     |
| Error          | `#c62828` | Error messages                           |
| Surface        | `#fafafa` | Card backgrounds, input backgrounds      |
| Border         | `#222222` | Card borders (1.5px solid)               |
| Light border   | `#e0e0e0` | Button borders, input borders            |
| CTA            | `#000000` bg / `#ffffff` text | Primary buttons            |
| Success        | `#2e7d32` | High confidence indicators               |
| Warning        | `#f9a825` | Medium confidence indicators             |
| Danger         | `#c62828` | Low confidence indicators                |

### Typography

| Element             | Size      | Weight |
|---------------------|-----------|--------|
| Welcome title       | 3rem      | 700    |
| Features title      | 2.25rem   | 700    |
| Demo title          | 2rem      | 700    |
| Feature card label  | 1.125rem  | 600    |
| Body / subtitle     | 1.25rem / 1.125rem | 400 |
| Description         | 0.875rem  | 400    |
| Labels              | 0.75rem   | 600, uppercase, letter-spacing 0.05em |

### Spacing & Radii

| Token              | Value   |
|--------------------|---------|
| Card border-radius | 12px    |
| Button border-radius | 12px (CTA), 8px (secondary) |
| Card padding       | 20px 16px |
| Card min-height    | 80px    |
| Touch target min   | 44px × 44px |
| Feature list gap   | 16px    |
| Content max-width  | 480px   |

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

---

## Registering with Demo Kiosk

| Field       | Value                                   |
|-------------|----------------------------------------|
| Title       | Vision API                             |
| Tags        | Vision, Image Analysis                 |
| Demo URL    | `https://<your-deployment-url>`        |
| Launch Mode | `newTab` or `sameTab`                  |
| Thumbnail   | `/images/vision-api-thumbnail.png`     |

---

## Implementation Order

### Phase 1 — Scaffold & Infrastructure

1. Initialize project (Vite + React 19 + TypeScript)
2. Create global styles (`index.css`) — copy from reference repos
3. Create `WelcomeScreen`, `FeaturesScreen`, `DemoScreen` shell pages
4. Create `types.ts` with all 13 features
5. Set up Express API backend with health routes
6. Create Azure AI Vision client (`visionClient.ts`) with `DefaultAzureCredential`
7. Create API analysis route (`/api/vision/analyze`)
8. Create Bicep infrastructure modules
9. Create GitHub Actions workflow
10. Create Dockerfiles, `nginx.conf`, `docker-compose.yml`

### Phase 2 — Shared Components & Hook

11. Implement `ImageUploader` (drag-drop, file picker, camera, paste)
12. Implement `ImageCanvas` (bounding box + text overlay rendering)
13. Implement `ConfidenceBadge` component
14. Implement `SampleImagePicker` component
15. Implement `useVisionAnalysis` hook (REST client + state management)
16. Implement `visionClient.ts` service (SPA-side REST calls)
17. Add sample images to `public/samples/`

### Phase 3 — Demo Components (ordered by complexity)

18. **Image Captioning** — simplest demo, validates full image → API → result loop
19. **Image Tagging** — adds tag cloud rendering
20. **Alt-Text Generator** — combines caption + tags, composition logic
21. **Object Detection** — first canvas-based demo, validates bounding box rendering
22. **Dense Captions** — adds region-caption interaction (click to highlight)
23. **Face Detection** — similar to object detection, simpler output
24. **Smart Crop Suggestions** — adds crop preview generation on canvas
25. **OCR – Text Extraction** — validates OCR pipeline, text overlay
26. **Receipt / Label Reading** — adds client-side post-parsing
27. **Diagram / Whiteboard OCR** — positioned text labels variant
28. **Brand & Content Safety** — adds severity gauges, content blurring
29. **Image Search by Tags** — batch analysis + search/filter UI
30. **Video Frame Analysis** — most complex: video handling + batch processing

### Phase 4 — Polish & Deploy

31. Add thumbnail image for kiosk registry
32. Test iframe embedding
33. Test all demos end-to-end with real Azure AI Vision endpoint
34. Deploy to Azure Container Apps
35. Register with Demo Kiosk

---

## Prerequisites

- Node.js v20+
- Docker (for container builds)
- Azure AI Vision resource (Computer Vision) with Image Analysis 4.0 support
- Azure subscription with resource group
- Azure AD App Registration with OIDC federated credential for GitHub Actions
