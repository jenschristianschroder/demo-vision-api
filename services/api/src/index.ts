import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.js';
import visionRoutes from './routes/vision.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));

app.use('/health', healthRoutes);
app.use('/api/vision', visionRoutes);

app.listen(PORT, () => {
  console.log(`Vision API server listening on port ${PORT}`);
});
