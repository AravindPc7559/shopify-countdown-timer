import Timer from '../models/Timer.js';

// Helper function to calculate status for fixed timers
const calculateStatus = (timer) => {
  if (timer.type === 'fixed') {
    const now = new Date();
    if (!timer.startDate || !timer.endDate) {
      return 'scheduled';
    }
    if (now < timer.startDate) {
      return 'scheduled';
    } else if (now >= timer.startDate && now <= timer.endDate) {
      return 'active';
    } else {
      return 'expired';
    }
  }
  return timer.status || 'active';
};

// GET /api/timers - List all timers for shop
export const getTimers = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    
    const timers = await Timer.find({ shop }).sort({ createdAt: -1 });
    
    // Update status for fixed timers
    const timersWithStatus = timers.map(timer => {
      const timerObj = timer.toObject();
      timerObj.status = calculateStatus(timerObj);
      return timerObj;
    });
    
    res.status(200).json({ timers: timersWithStatus });
  } catch (error) {
    console.error('Error fetching timers:', error);
    res.status(500).json({ error: 'Failed to fetch timers' });
  }
};

// POST /api/timers - Create new timer
export const createTimer = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const timerData = {
      ...req.body,
      shop,
    };
    
    // Calculate status for fixed timers
    if (timerData.type === 'fixed') {
      timerData.status = calculateStatus(timerData);
    } else {
      timerData.status = 'active';
    }
    
    const timer = new Timer(timerData);
    await timer.save();
    
    res.status(201).json({ timer });
  } catch (error) {
    console.error('Error creating timer:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create timer' });
    }
  }
};

// GET /api/timers/:id - Get single timer
export const getTimer = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const { id } = req.params;
    
    const timer = await Timer.findOne({ _id: id, shop });
    
    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    
    const timerObj = timer.toObject();
    timerObj.status = calculateStatus(timerObj);
    
    res.status(200).json({ timer: timerObj });
  } catch (error) {
    console.error('Error fetching timer:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid timer ID' });
    } else {
      res.status(500).json({ error: 'Failed to fetch timer' });
    }
  }
};

// PUT /api/timers/:id - Update timer
export const updateTimer = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const { id } = req.params;
    
    const timer = await Timer.findOne({ _id: id, shop });
    
    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    
    // Update timer fields
    Object.assign(timer, req.body);
    
    // Recalculate status for fixed timers
    if (timer.type === 'fixed') {
      timer.status = calculateStatus(timer);
    }
    
    await timer.save();
    
    const timerObj = timer.toObject();
    timerObj.status = calculateStatus(timerObj);
    
    res.status(200).json({ timer: timerObj });
  } catch (error) {
    console.error('Error updating timer:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
    } else if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid timer ID' });
    } else {
      res.status(500).json({ error: 'Failed to update timer' });
    }
  }
};

// DELETE /api/timers/:id - Delete timer
export const deleteTimer = async (req, res) => {
  try {
    const shop = res.locals.shopify.session.shop;
    const { id } = req.params;
    
    const timer = await Timer.findOneAndDelete({ _id: id, shop });
    
    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    
    res.status(200).json({ message: 'Timer deleted successfully' });
  } catch (error) {
    console.error('Error deleting timer:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid timer ID' });
    } else {
      res.status(500).json({ error: 'Failed to delete timer' });
    }
  }
};

// GET /api/timers/public/:productId - Public endpoint for widget (no auth)
export const getPublicTimer = async (req, res) => {
  try {
    const { productId } = req.params;
    const shop = req.query.shop; // Get shop from query parameter
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' });
    }
    
    const now = new Date();
    
    // Find active timers for this product
    const timers = await Timer.find({
      shop,
      $or: [
        { targetType: 'all' },
        { targetType: 'products', targetIds: productId },
        { targetType: 'collections', targetIds: { $in: [] } }, // Collections handled separately
      ],
    });
    
    // Filter by status and dates
    const activeTimers = timers.filter(timer => {
      if (timer.type === 'evergreen') {
        return timer.status === 'active';
      } else {
        // Fixed timer - check dates
        if (!timer.startDate || !timer.endDate) return false;
        return now >= timer.startDate && now <= timer.endDate;
      }
    });
    
    // Return only the first active timer (or none)
    const timer = activeTimers.length > 0 ? activeTimers[0] : null;
    
    if (!timer) {
      return res.status(200).json({ timer: null });
    }
    
    // Return minimal data for widget
    const timerData = {
      id: timer._id,
      type: timer.type,
      endDate: timer.endDate,
      duration: timer.duration,
      appearance: timer.appearance,
    };
    
    // Set cache headers for optimization
    res.set('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds
    res.status(200).json({ timer: timerData });
  } catch (error) {
    console.error('Error fetching public timer:', error);
    res.status(500).json({ error: 'Failed to fetch timer' });
  }
};

// POST /api/timers/public/impression - Track impression (no auth)
export const trackImpression = async (req, res) => {
  try {
    const { timerId } = req.body;
    
    if (!timerId) {
      return res.status(400).json({ error: 'Timer ID is required' });
    }
    
    // Increment impression count
    const timer = await Timer.findByIdAndUpdate(
      timerId,
      { $inc: { impressions: 1 } },
      { new: true }
    );
    
    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }
    
    // Return success (no sensitive data)
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking impression:', error);
    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid timer ID' });
    } else {
      res.status(500).json({ error: 'Failed to track impression' });
    }
  }
};
