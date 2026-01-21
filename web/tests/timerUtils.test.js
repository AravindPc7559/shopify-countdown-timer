import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateStatus,
  isTimerActive,
  formatPublicTimerData,
} from '../utils/timerUtils.js';

describe('calculateStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fixed timer', () => {
    it('should return "scheduled" before start date', () => {
      vi.setSystemTime(new Date('2025-01-01'));
      const timer = {
        type: 'fixed',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
      };
      expect(calculateStatus(timer)).toBe('scheduled');
    });

    it('should return "active" within date range', () => {
      vi.setSystemTime(new Date('2025-06-15'));
      const timer = {
        type: 'fixed',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
      };
      expect(calculateStatus(timer)).toBe('active');
    });

    it('should return "expired" after end date', () => {
      vi.setSystemTime(new Date('2025-07-01'));
      const timer = {
        type: 'fixed',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
      };
      expect(calculateStatus(timer)).toBe('expired');
    });
  });

  describe('evergreen timer', () => {
    it('should return existing status', () => {
      const timer = {
        type: 'evergreen',
        status: 'active',
      };
      expect(calculateStatus(timer)).toBe('active');
    });

    it('should return "active" as default when status is missing', () => {
      const timer = {
        type: 'evergreen',
      };
      expect(calculateStatus(timer)).toBe('active');
    });
  });
});

describe('isTimerActive', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('evergreen timer', () => {
    it('should return true for active status', () => {
      const timer = {
        type: 'evergreen',
        status: 'active',
      };
      expect(isTimerActive(timer)).toBe(true);
    });

    it('should return false for non-active status', () => {
      const timer = {
        type: 'evergreen',
        status: 'scheduled',
      };
      expect(isTimerActive(timer)).toBe(false);
    });
  });

  describe('fixed timer', () => {
    it('should return true within date range', () => {
      vi.setSystemTime(new Date('2025-06-15'));
      const timer = {
        type: 'fixed',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
      };
      expect(isTimerActive(timer)).toBe(true);
    });

    it('should return false before start date', () => {
      vi.setSystemTime(new Date('2025-05-15'));
      const timer = {
        type: 'fixed',
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-06-30'),
      };
      expect(isTimerActive(timer)).toBe(false);
    });

    it('should return false when dates are missing', () => {
      const timer = {
        type: 'fixed',
      };
      expect(isTimerActive(timer)).toBe(false);
    });
  });
});

describe('formatPublicTimerData', () => {
  it('should format complete timer data', () => {
    const timer = {
      _id: '507f1f77bcf86cd799439011',
      type: 'fixed',
      endDate: new Date('2025-02-28T12:00:00Z'),
      duration: 3600,
      appearance: {
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        position: 'top',
        text: 'Hurry! Sale ends in',
      },
    };

    const result = formatPublicTimerData(timer);

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439011',
      type: 'fixed',
      endDate: new Date('2025-02-28T12:00:00Z'),
      duration: 3600,
      appearance: {
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        position: 'top',
        text: 'Hurry! Sale ends in',
      },
    });
  });

  it('should handle missing optional fields', () => {
    const timer = {
      _id: '507f1f77bcf86cd799439013',
      type: 'evergreen',
    };

    const result = formatPublicTimerData(timer);

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439013',
      type: 'evergreen',
      endDate: undefined,
      duration: undefined,
      appearance: undefined,
    });
  });

  it('should convert _id to id', () => {
    const timer = {
      _id: 'custom-id-123',
      type: 'fixed',
    };

    const result = formatPublicTimerData(timer);

    expect(result.id).toBe('custom-id-123');
    expect(result._id).toBeUndefined();
  });
});
