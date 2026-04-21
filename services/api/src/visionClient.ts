import { DefaultAzureCredential } from '@azure/identity';
import createImageAnalysisClient, {
  ImageAnalysisClient,
} from '@azure-rest/ai-vision-image-analysis';

let client: ImageAnalysisClient | null = null;

export function getVisionClient(): ImageAnalysisClient {
  if (client) return client;

  const endpoint = process.env.AZURE_VISION_ENDPOINT;
  if (!endpoint) {
    throw new Error('AZURE_VISION_ENDPOINT environment variable is required');
  }

  const credential = new DefaultAzureCredential();
  client = createImageAnalysisClient(endpoint, credential);
  return client;
}
