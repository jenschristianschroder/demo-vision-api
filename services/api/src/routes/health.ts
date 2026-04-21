import { Router, Request, Response } from 'express';

const router = Router();

router.get('/ready', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
