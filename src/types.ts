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

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface VisionResult {
  caption?: { text: string; confidence: number };
  denseCaptions?: Array<{ text: string; confidence: number; boundingBox: BoundingBox }>;
  objects?: Array<{ name: string; confidence: number; boundingBox: BoundingBox }>;
  tags?: Array<{ name: string; confidence: number }>;
  read?: ReadResult;
  people?: Array<{ boundingBox: BoundingBox; confidence: number }>;
  smartCrops?: Array<{ aspectRatio: number; boundingBox: BoundingBox }>;
  adult?: {
    isAdultContent: boolean;
    isRacyContent: boolean;
    isGoryContent: boolean;
    adultScore: number;
    racyScore: number;
    goreScore: number;
  };
}

export interface ReadResult {
  blocks: Array<{
    lines: Array<{
      text: string;
      boundingPolygon: Array<{ x: number; y: number }>;
      words: Array<{
        text: string;
        confidence: number;
        boundingPolygon: Array<{ x: number; y: number }>;
      }>;
    }>;
  }>;
}
