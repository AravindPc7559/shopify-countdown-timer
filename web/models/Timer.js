import mongoose from 'mongoose';

const timerSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['fixed', 'evergreen'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    targetType: {
      type: String,
      required: true,
      enum: ['all', 'products', 'collections'],
      default: 'all',
    },
    targetIds: {
      type: [String],
      default: [],
    },
    appearance: {
      backgroundColor: {
        type: String,
        default: '#000000',
      },
      textColor: {
        type: String,
        default: '#FFFFFF',
      },
      position: {
        type: String,
        enum: ['top', 'bottom', 'middle'],
        default: 'top',
      },
      text: {
        type: String,
        default: 'Hurry! Sale ends in',
      },
    },
    status: {
      type: String,
      enum: ['active', 'scheduled', 'expired'],
      default: 'scheduled',
    },
    impressions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Basic index for queries
timerSchema.index({ shop: 1, status: 1 });

const Timer = mongoose.model('Timer', timerSchema);

export default Timer;
