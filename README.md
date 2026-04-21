# Vision API Demo

Interactive kiosk-style demo showcasing 13 capabilities of the Azure AI Vision
Image Analysis 4.0 API. Built with React 19, TypeScript, Vite, and an Express
REST API backend.

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | Image Captioning | Single image → caption + confidence |
| 2 | Dense Captions | Region-level captions with bounding boxes |
| 3 | Object Detection | Bounding boxes rendered on canvas |
| 4 | Image Tagging | Top tags with confidence scores |
| 5 | Smart Crop Suggestions | Auto-generated crops for different ratios |
| 6 | OCR – Text Extraction | Printed and handwritten text with overlay |
| 7 | Receipt & Label Reading | OCR + lightweight post-parsing |
| 8 | Diagram / Whiteboard OCR | Extract text lines with spatial positioning |
| 9 | Brand & Content Safety | Adult/racy/gory content signals |
| 10 | Face Detection | Bounding boxes only (no identification) |
| 11 | Alt-Text Generator | Caption + tags composed for accessibility |
| 12 | Image Search by Tags | Local gallery search/filter |
| 13 | Video Frame Analysis | Per-frame image analysis from video |

## Architecture

```
Browser (React SPA)
    ↕ REST POST /api/vision/*
Express API (Node.js)
    ↕ REST (HTTPS)
Azure AI Vision API (Image Analysis 4.0)
```

- SPA: React 19 + Vite, served via nginx in Docker
- API: Express + `@azure-rest/ai-vision-image-analysis`, authenticates via Managed Identity
- Auth: No API keys — uses `@azure/identity` (DefaultAzureCredential)
- Infra: Azure Container Apps, ACR, Bicep IaC
- CI/CD: GitHub Actions with OIDC federated credentials

## Quick Start (Local)

### Prerequisites

- Node.js 20+
- An Azure AI Vision resource (Computer Vision)
- Azure CLI logged in (`az login`)

### 1. Install dependencies

```sh
npm install
cd services/api && npm install && cd ../..
```

### 2. Configure environment

```sh
cp .env.example services/api/.env
# Edit services/api/.env with your Azure Vision endpoint
```

### 3. Run

```sh
# Terminal 1 — API
cd services/api && npm run dev

# Terminal 2 — SPA
npm run dev
```

Open http://localhost:3000

## Deploy to Azure

### GitHub Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| AZURE_CLIENT_ID | ✅ | App registration client ID (OIDC) |
| AZURE_TENANT_ID | ✅ | Azure AD tenant ID |
| AZURE_SUBSCRIPTION_ID | ✅ | Azure subscription ID |
| AZURE_RESOURCE_GROUP | ✅ | Target resource group name |
| AZURE_VISION_ENDPOINT | ✅ | Azure AI Vision endpoint URL |
| AZURE_VISION_RESOURCE_ID | ⚠️ Recommended | Full resource ID for Managed Identity role assignment |

Push to `main` or trigger the workflow manually.

## License

MIT
