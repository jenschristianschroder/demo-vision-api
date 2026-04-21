import { Router, Request, Response } from 'express';
import { getVisionClient } from '../visionClient.js';
import { DefaultAzureCredential } from '@azure/identity';
import { isUnexpected } from '@azure-rest/ai-vision-image-analysis';

const router = Router();

// The Azure Vision API expects PascalCase feature names.
// Map common camelCase variants sent by the frontend.
const featureNameMap: Record<string, string> = {
  caption: 'Caption',
  densecaptions: 'DenseCaptions',
  objects: 'Objects',
  people: 'People',
  read: 'Read',
  smartcrops: 'SmartCrops',
  tags: 'Tags',
};

function normalizeFeature(f: string): string {
  return featureNameMap[f.toLowerCase()] ?? f;
}

interface AnalyzeRequest {
  image: string; // base64-encoded image
  features: string[];
  smartCropsAspectRatios?: number[];
}

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { image, features, smartCropsAspectRatios } = req.body as AnalyzeRequest;

    if (!image || !features || !features.length) {
      res.status(400).json({ error: 'image and features are required' });
      return;
    }

    const imageBuffer = Buffer.from(image, 'base64');
    const client = getVisionClient();

    const normalizedFeatures = features.map(normalizeFeature);

    const response = await client.path('/imageanalysis:analyze').post({
      body: imageBuffer,
      contentType: 'application/octet-stream',
      queryParameters: {
        features: normalizedFeatures,
        ...(smartCropsAspectRatios?.length
          ? { 'smartcrops-aspect-ratios': smartCropsAspectRatios }
          : {}),
      },
    });

    if (isUnexpected(response)) {
      res.status(parseInt(response.status)).json({
        error: 'Vision API error',
        details: response.body,
      });
      return;
    }

    const body = response.body;
    const result: Record<string, unknown> = {};

    if (body.captionResult) {
      result.caption = { text: body.captionResult.text, confidence: body.captionResult.confidence };
    }

    if (body.denseCaptionsResult) {
      result.denseCaptions = body.denseCaptionsResult.values.map((v) => ({
        text: v.text,
        confidence: v.confidence,
        boundingBox: v.boundingBox,
      }));
    }

    if (body.objectsResult) {
      result.objects = body.objectsResult.values.map((v) => ({
        name: v.tags?.[0]?.name ?? 'unknown',
        confidence: v.tags?.[0]?.confidence ?? 0,
        boundingBox: v.boundingBox,
      }));
    }

    if (body.tagsResult) {
      result.tags = body.tagsResult.values.map((v) => ({
        name: v.name,
        confidence: v.confidence,
      }));
    }

    if (body.readResult) {
      result.read = body.readResult;
    }

    if (body.peopleResult) {
      result.people = body.peopleResult.values.map((v) => ({
        boundingBox: v.boundingBox,
        confidence: v.confidence,
      }));
    }

    if (body.smartCropsResult) {
      result.smartCrops = body.smartCropsResult.values.map((v) => ({
        aspectRatio: v.aspectRatio,
        boundingBox: v.boundingBox,
      }));
    }

    res.json(result);
  } catch (err) {
    console.error('Vision analysis error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Separate endpoint for adult/racy/gory content detection using Computer Vision 3.2 API
router.post('/adult', async (req: Request, res: Response) => {
  try {
    const { image } = req.body as { image: string };
    if (!image) {
      res.status(400).json({ error: 'image is required' });
      return;
    }

    const endpoint = process.env.AZURE_VISION_ENDPOINT;
    if (!endpoint) {
      res.status(500).json({ error: 'AZURE_VISION_ENDPOINT not configured' });
      return;
    }

    const credential = new DefaultAzureCredential();
    const tokenResponse = await credential.getToken('https://cognitiveservices.azure.com/.default');

    const imageBuffer = Buffer.from(image, 'base64');
    const url = `${endpoint.replace(/\/$/, '')}/vision/v3.2/analyze?visualFeatures=Adult`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        Authorization: `Bearer ${tokenResponse.token}`,
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: 'Vision 3.2 API error', details: errorText });
      return;
    }

    const body = (await response.json()) as {
      adult?: {
        isAdultContent: boolean;
        isRacyContent: boolean;
        isGoryContent: boolean;
        adultScore: number;
        racyScore: number;
        goreScore: number;
      };
    };

    res.json({ adult: body.adult });
  } catch (err) {
    console.error('Adult content detection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
