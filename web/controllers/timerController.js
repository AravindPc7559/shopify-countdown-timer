import Timer from '../models/Timer.js';
import {
  calculateStatus,
  getShopFromRequest,
  handleDatabaseError,
  setCORSHeaders,
  isTimerActive,
  buildTimerQuery,
  formatTimerForResponse,
  formatPublicTimerData,
} from '../utils/timerUtils.js';

export const getTimers = async (req, res) => {
  try {
    const shop = getShopFromRequest(req, res);
    if (!shop) {
      return res.status(400).json({ error: 'Shop information is required' });
    }

    const timers = await Timer.find({ shop }).sort({ createdAt: -1 });
    const timersWithStatus = timers.map(formatTimerForResponse);

    res.status(200).json({ timers: timersWithStatus });
  } catch (error) {
    handleDatabaseError(error, res, 'Failed to fetch timers');
  }
};

export const createTimer = async (req, res) => {
  try {
    const shop = getShopFromRequest(req, res);
    if (!shop) {
      return res.status(400).json({ error: 'Shop information is required' });
    }

    const timerData = {
      ...req.body,
      shop,
    };

    if (timerData.type === 'fixed') {
      timerData.status = calculateStatus(timerData);
    } else {
      timerData.status = 'active';
    }

    const timer = new Timer(timerData);
    await timer.save();

    res.status(201).json({ timer: formatTimerForResponse(timer) });
  } catch (error) {
    handleDatabaseError(error, res, 'Failed to create timer');
  }
};

export const getTimer = async (req, res) => {
  try {
    const shop = getShopFromRequest(req, res);
    if (!shop) {
      return res.status(400).json({ error: 'Shop information is required' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Timer ID is required' });
    }

    const timer = await Timer.findOne({ _id: id, shop });
    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    res.status(200).json({ timer: formatTimerForResponse(timer) });
  } catch (error) {
    handleDatabaseError(error, res, 'Failed to fetch timer');
  }
};

export const updateTimer = async (req, res) => {
  try {
    const shop = getShopFromRequest(req, res);
    if (!shop) {
      return res.status(400).json({ error: 'Shop information is required' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Timer ID is required' });
    }

    const timer = await Timer.findOne({ _id: id, shop });
    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    Object.assign(timer, req.body);

    if (timer.type === 'fixed') {
      timer.status = calculateStatus(timer);
    }

    await timer.save();

    res.status(200).json({ timer: formatTimerForResponse(timer) });
  } catch (error) {
    handleDatabaseError(error, res, 'Failed to update timer');
  }
};

export const deleteTimer = async (req, res) => {
  try {
    const shop = getShopFromRequest(req, res);
    if (!shop) {
      return res.status(400).json({ error: 'Shop information is required' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Timer ID is required' });
    }

    const timer = await Timer.findOneAndDelete({ _id: id, shop });
    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    res.status(200).json({ message: 'Timer deleted successfully' });
  } catch (error) {
    handleDatabaseError(error, res, 'Failed to delete timer');
  }
};

export const getPublicTimer = async (req, res) => {
  setCORSHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { productId } = req.params;
    const shop = req.query?.shop;

    if (!shop) {
      setCORSHeaders(res);
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    if (!productId) {
      setCORSHeaders(res);
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const query = buildTimerQuery(shop, productId);
    const timers = await Timer.find(query);
    const activeTimers = timers.filter(isTimerActive);

    if (activeTimers.length === 0) {
      res.set('Cache-Control', 'public, max-age=60');
      return res.status(200).json({ timer: null });
    }

    const timer = activeTimers[0];
    const timerData = formatPublicTimerData(timer);

    res.set('Cache-Control', 'public, max-age=60');
    res.status(200).json({ timer: timerData });
  } catch (error) {
    setCORSHeaders(res);
    handleDatabaseError(error, res, 'Failed to fetch timer');
  }
};

export const trackImpression = async (req, res) => {
  setCORSHeaders(res);

  try {
    const { timerId } = req.query;

    if (!timerId) {
      setCORSHeaders(res);
      return res.status(400).json({ error: 'Timer ID is required' });
    }

    const timer = await Timer.findByIdAndUpdate(
      timerId,
      { $inc: { impressions: 1 } },
      { new: true }
    );

    if (!timer) {
      setCORSHeaders(res);
      return res.status(404).json({ error: 'Timer not found' });
    }

    res.status(200).json({ success: true, impressions: timer.impressions });
  } catch (error) {
    setCORSHeaders(res);
    handleDatabaseError(error, res, 'Failed to track impression');
  }
};
