import express from 'express';
import {
  getTimers,
  createTimer,
  getTimer,
  updateTimer,
  deleteTimer,
} from '../controllers/timerController.js';
import { validateTimerInput } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.get('/', getTimers);
router.post('/', validateTimerInput, createTimer);
router.get('/:id', getTimer);
router.put('/:id', validateTimerInput, updateTimer);
router.delete('/:id', deleteTimer);

export default router;
