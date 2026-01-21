import {
  validateAppearance,
  validateTimerName,
} from '../utils/validationUtils.js';

export const validateTimerInput = (req, res, next) => {
  try {
    const { body } = req;

    if (body.name !== undefined) {
      body.name = validateTimerName(body.name);
      if (!body.name) {
        return res.status(400).json({ error: 'Timer name is required and cannot be empty' });
      }
    }

    if (body.type !== undefined) {
      const validTypes = ['fixed', 'evergreen'];
      if (!validTypes.includes(body.type)) {
        return res.status(400).json({
          error: `Invalid timer type. Must be one of: ${validTypes.join(', ')}`,
        });
      }
    }

    if (body.targetType !== undefined) {
      const validTargetTypes = ['all', 'products', 'collections'];
      if (!validTargetTypes.includes(body.targetType)) {
        return res.status(400).json({
          error: `Invalid target type. Must be one of: ${validTargetTypes.join(', ')}`,
        });
      }
    }

    if (body.targetIds !== undefined) {
      if (!Array.isArray(body.targetIds)) {
        return res.status(400).json({ error: 'targetIds must be an array' });
      }
      body.targetIds = body.targetIds.filter((id) => typeof id === 'string' && id.trim().length > 0);
    }

    if (body.appearance !== undefined) {
      body.appearance = validateAppearance(body.appearance);
    }

    if (body.type === 'fixed') {
      if (body.startDate !== undefined && body.startDate) {
        const startDate = new Date(body.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: 'Invalid startDate format' });
        }
        body.startDate = startDate;
      }

      if (body.endDate !== undefined && body.endDate) {
        const endDate = new Date(body.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: 'Invalid endDate format' });
        }
        body.endDate = endDate;
      }

      if (body.startDate && body.endDate && body.startDate >= body.endDate) {
        return res.status(400).json({
          error: 'endDate must be after startDate',
        });
      }
    }

    if (body.type === 'evergreen' && body.duration !== undefined) {
      const duration = Number(body.duration);
      if (isNaN(duration) || duration <= 0) {
        return res.status(400).json({
          error: 'Duration must be a positive number (in seconds)',
        });
      }
      body.duration = duration;
    }

    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input data', details: error.message });
  }
};

export const validateAppearanceInput = (req, res, next) => {
  try {
    if (req.body.appearance !== undefined) {
      req.body.appearance = validateAppearance(req.body.appearance);
    }
    next();
  } catch (error) {
    return res.status(400).json({ error: 'Invalid appearance data', details: error.message });
  }
};
