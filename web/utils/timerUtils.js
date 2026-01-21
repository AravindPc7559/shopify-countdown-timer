const calculateStatus = (timer) => {
  if (timer.type !== 'fixed') {
    return timer.status || 'active';
  }

  if (!timer.startDate || !timer.endDate) {
    return 'scheduled';
  }

  const now = new Date();
  if (now < timer.startDate) {
    return 'scheduled';
  }
  if (now >= timer.startDate && now <= timer.endDate) {
    return 'active';
  }
  return 'expired';
};

const getShopFromRequest = (req, res) => {
  if (res.locals?.shopify?.session?.shop) {
    return res.locals.shopify.session.shop;
  }
  return req.query?.shop || null;
};

const handleDatabaseError = (error, res, defaultMessage) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid timer ID format' });
  }
  return res.status(500).json({ error: defaultMessage });
};

const isTimerActive = (timer) => {
  if (timer.type === 'evergreen') {
    return timer.status === 'active';
  }

  if (!timer.startDate || !timer.endDate) {
    return false;
  }

  const now = new Date();
  const startDate = new Date(timer.startDate);
  const endDate = new Date(timer.endDate);
  return now >= startDate && now <= endDate;
};

const buildTimerQuery = (shop, productId) => {
  return {
    shop,
    $or: [
      { targetType: 'all' },
      { targetType: 'products', targetIds: productId },
      { targetType: 'collections', targetIds: { $in: [] } },
    ],
  };
};

const formatTimerForResponse = (timer) => {
  const timerObj = timer.toObject ? timer.toObject() : timer;
  return {
    ...timerObj,
    status: calculateStatus(timerObj),
  };
};

const formatPublicTimerData = (timer) => {
  return {
    id: timer._id,
    type: timer.type,
    endDate: timer.endDate,
    duration: timer.duration,
    appearance: timer.appearance,
  };
};

export {
  calculateStatus,
  getShopFromRequest,
  handleDatabaseError,
  isTimerActive,
  buildTimerQuery,
  formatTimerForResponse,
  formatPublicTimerData,
};

