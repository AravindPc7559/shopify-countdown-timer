import express from 'express';
import {
  getTimers,
  createTimer,
  getTimer,
  updateTimer,
  deleteTimer,
  getPublicTimer,
  trackImpression,
} from '../controllers/timerController.js';

const router = express.Router();

router.get('/', getTimers);
router.post('/', createTimer);
router.get('/:id', getTimer);
router.put('/:id', updateTimer);
router.delete('/:id', deleteTimer);

export default router;

export const publicRouter = express.Router();
publicRouter.get('/:productId', getPublicTimer);
publicRouter.post('/impression', trackImpression);
