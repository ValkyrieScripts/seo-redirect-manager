import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { regenerateAndReload } from '../services/nginxGenerator';

const router = Router();

// Manually trigger nginx config regeneration and reload
router.post('/reload', authenticateToken, async (req: AuthRequest, res: Response) => {
  const result = await regenerateAndReload();

  if (result.success) {
    res.json({ message: result.message });
  } else {
    res.status(500).json({ error: result.message });
  }
});

export default router;
