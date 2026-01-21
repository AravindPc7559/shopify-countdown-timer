import express from 'express';
import {
  getPublicTimer,
  trackImpression,
} from '../controllers/timerController.js';

const publicRouter = express.Router();

publicRouter.get('/timers/public/impression', trackImpression);
publicRouter.get('/timers/public/:productId', getPublicTimer);

export default publicRouter;
