/**
 * Countdown Timer Widget
 * Lightweight Preact-based widget for displaying countdown timers on product pages
 * Target bundle size: <30KB gzipped
 */

(function () {
  'use strict';

  // Preact-like minimal implementation for lightweight bundle
  const h = (tag, props, ...children) => {
    const el = typeof tag === 'string' ? document.createElement(tag) : tag();
    if (props) {
      Object.keys(props).forEach(key => {
        if (key === 'style' && typeof props.style === 'object') {
          Object.assign(el.style, props.style);
        } else if (key === 'className') {
          el.className = props.className;
        } else if (key.startsWith('on') && typeof props[key] === 'function') {
          el.addEventListener(key.slice(2).toLowerCase(), props[key]);
        } else if (key !== 'children') {
          el.setAttribute(key, props[key]);
        }
      });
    }
    children.forEach(child => {
      if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(child));
      } else if (child) {
        el.appendChild(child);
      }
    });
    return el;
  };

  // Timer state management
  class CountdownTimer {
    constructor(container, config) {
      this.container = container;
      this.config = config;
      this.timer = null;
      this.intervalId = null;
      this.isUrgent = false;
      this.impressionTracked = false;
    }

    async init() {
      try {
        await this.fetchTimer();
      } catch (error) {
        console.error('Countdown timer error:', error);
        // Fail silently - don't break storefront
        this.container.style.display = 'none';
        return;
      }
    }

    async fetchTimer() {
      let productId = this.container.dataset.productId;
      const shop = this.container.dataset.shop;
      let apiUrl = this.container.dataset.apiUrl;

      console.log('Countdown Timer: Fetching timer data', { productId, shop, apiUrl });

      if (!productId || !shop) {
        console.warn('Countdown Timer: Missing productId or shop', { productId, shop });
        this.container.style.display = 'none';
        return;
      }

      // Extract numeric ID from GID format if present (e.g., "gid://shopify/Product/123456" -> "123456")
      if (productId.includes('/')) {
        const parts = productId.split('/');
        productId = parts[parts.length - 1];
        console.log('Countdown Timer: Extracted product ID from GID', productId);
      }

      // Construct API URL from shop domain if not provided
      if (!apiUrl || apiUrl.trim() === '') {
        // Try to get API URL from meta tag
        const apiUrlMeta = document.querySelector('meta[name="countdown-timer-api-url"]');
        if (apiUrlMeta) {
          apiUrl = apiUrlMeta.getAttribute('content');
        } else {
          // Don't use window.location.origin as fallback - it's the storefront, not the app
          console.error('Countdown Timer: API URL not configured!', {
            message: 'Please set the App API URL in the Countdown Timer block settings.',
            currentOrigin: window.location.origin,
            instruction: 'When running "npm run dev", copy the tunnel URL from your terminal and paste it in the block settings.'
          });
          this.container.style.display = 'none';
          // Show error message in development
          if (window.location.hostname.includes('myshopify.com') || window.location.hostname === 'localhost') {
            this.container.innerHTML = '<div style="padding: 1rem; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404;">⚠️ Countdown Timer: Please configure the App API URL in the block settings.</div>';
            this.container.style.display = 'block';
          }
          return;
        }
      }

      const apiEndpoint = `${apiUrl}/api/timers/public/${productId}?shop=${encodeURIComponent(shop)}`;
      console.log('Countdown Timer: API endpoint', apiEndpoint);

      try {
        const response = await fetch(apiEndpoint, {
          method: 'GET',
          mode: 'cors',
          cache: 'default',
        });

        console.log('Countdown Timer: API response status', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Countdown Timer: API error', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Countdown Timer: API response data', data);

        if (data.timer) {
          this.timer = data.timer;
          console.log('Countdown Timer: Timer found, rendering', this.timer);
          // Make sure container is visible
          this.container.style.display = 'block';
          this.render();
          this.startCountdown();
          this.trackImpression();
        } else {
          console.log('Countdown Timer: No active timer found for this product');
          console.log('Countdown Timer: Full API response was:', data);
          // Hide container if no timer
          this.container.style.display = 'none';
        }
      } catch (error) {
        // Log error for debugging but don't break storefront
        console.error('Countdown Timer: Failed to fetch timer', {
          error: error.message,
          productId,
          shop,
          apiUrl,
          stack: error.stack
        });
      }
    }

    trackImpression() {
      if (this.impressionTracked || !this.timer) return;

      let apiUrl = this.container.dataset.apiUrl;
      if (!apiUrl) {
        const apiUrlMeta = document.querySelector('meta[name="countdown-timer-api-url"]');
        apiUrl = apiUrlMeta ? apiUrlMeta.getAttribute('content') : window.location.origin;
      }

      const impressionUrl = `${apiUrl}/api/timers/public/impression?timerId=${encodeURIComponent(this.timer.id)}`;
      
      fetch(impressionUrl, {
        method: 'GET',
        mode: 'cors',
      })
        .then(response => {
          if (response.ok) {
            console.log('[COUNTDOWN TIMER] ✅ Impression tracked successfully');
          } else {
            console.warn('[COUNTDOWN TIMER] ⚠️ Impression tracking failed:', response.status);
          }
        })
        .catch((error) => {
          console.warn('[COUNTDOWN TIMER] ⚠️ Impression tracking error (non-critical):', error.message);
        });

      this.impressionTracked = true;
    }

    getRemainingTime() {
      if (!this.timer) return null;

      let endTime;

      if (this.timer.type === 'evergreen') {
        // Evergreen timer: session-based, stored in localStorage
        const storageKey = `countdown_timer_${this.timer.id}`;
        let startTime = localStorage.getItem(storageKey);

        if (!startTime) {
          // First visit - initialize timer
          startTime = Date.now();
          localStorage.setItem(storageKey, startTime.toString());
        }

        const duration = this.timer.duration * 1000; // Convert to milliseconds
        endTime = parseInt(startTime) + duration;
      } else {
        // Fixed timer: use endDate from server
        endTime = new Date(this.timer.endDate).getTime();
      }

      const now = Date.now();
      const remaining = Math.max(0, endTime - now);

      // Check if timer expired
      if (remaining === 0 && this.timer.type === 'evergreen') {
        // Reset evergreen timer
        const storageKey = `countdown_timer_${this.timer.id}`;
        localStorage.removeItem(storageKey);
        this.container.style.display = 'none';
        return null;
      }

      return remaining;
    }

    formatTime(ms) {
      const totalSeconds = Math.floor(ms / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return {
        days: String(days).padStart(2, '0'),
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
      };
    }

    render() {
      const remaining = this.getRemainingTime();

      console.log('Countdown Timer: Rendering with remaining time', {
        remaining,
        remainingMs: remaining,
        timer: this.timer
      });

      if (remaining === null || remaining === 0) {
        console.warn('Countdown Timer: Timer expired or invalid remaining time', {
          remaining,
          timer: this.timer,
          endDate: this.timer?.endDate,
          type: this.timer?.type
        });
        this.container.style.display = 'none';
        return;
      }

      const appearance = this.timer.appearance || {};
      const text = appearance.text || 'Hurry! Sale ends in';
      const backgroundColor = appearance.backgroundColor || '#000000';
      const textColor = appearance.textColor || '#FFFFFF';
      const position = appearance.position || 'top';

      const time = this.formatTime(remaining);
      const hoursTotal = Math.floor(remaining / 3600000);

      // Check if urgent (< 1 hour remaining)
      const wasUrgent = this.isUrgent;
      this.isUrgent = hoursTotal < 1 && hoursTotal >= 0;

      // Update container styles
      this.container.style.backgroundColor = backgroundColor;
      this.container.style.color = textColor;
      this.container.style.display = 'block';

      // Add urgent class for animations
      if (this.isUrgent && !wasUrgent) {
        this.container.classList.add('countdown-timer-urgent');
      } else if (!this.isUrgent) {
        this.container.classList.remove('countdown-timer-urgent');
      }

      // Position classes
      this.container.className = this.container.className
        .replace(/countdown-timer-position-\w+/g, '');
      this.container.classList.add(`countdown-timer-position-${position}`);

      // Render timer display
      const existingDisplay = this.container.querySelector('.countdown-timer-display');
      if (existingDisplay) {
        existingDisplay.remove();
      }

      const display = h('div', {
        className: 'countdown-timer-display',
      });

      const textEl = h('div', {
        className: 'countdown-timer-text',
      }, text);

      const timeEl = h('div', {
        className: 'countdown-timer-time',
      });

      // Show days if > 0
      if (parseInt(time.days) > 0) {
        timeEl.appendChild(this.createTimeUnit('days', time.days));
      }

      timeEl.appendChild(this.createTimeUnit('hours', time.hours));
      timeEl.appendChild(this.createTimeUnit('minutes', time.minutes));
      timeEl.appendChild(this.createTimeUnit('seconds', time.seconds));

      display.appendChild(textEl);
      display.appendChild(timeEl);
      this.container.appendChild(display);
    }

    createTimeUnit(unit, value) {
      const unitEl = h('div', {
        className: `countdown-timer-unit countdown-timer-${unit}`,
      });

      const valueEl = h('span', {
        className: 'countdown-timer-value',
      }, value);

      const labelEl = h('span', {
        className: 'countdown-timer-label',
      }, unit.substring(0, 1).toUpperCase() + unit.substring(1));

      unitEl.appendChild(valueEl);
      unitEl.appendChild(labelEl);

      return unitEl;
    }

    startCountdown() {
      // Clear existing interval
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      // Initial render
      this.render();

      // Update every second
      this.intervalId = setInterval(() => {
        const remaining = this.getRemainingTime();

        if (remaining === null || remaining === 0) {
          this.container.style.display = 'none';
          clearInterval(this.intervalId);
          this.intervalId = null;
          return;
        }

        this.render();
      }, 1000);
    }

    destroy() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  // Initialize all timers on page load
  function initTimers() {
    console.log('Countdown Timer: Initializing timers...');
    const containers = document.querySelectorAll('.countdown-timer-container[data-product-id]');
    console.log('Countdown Timer: Found containers', containers.length);

    if (containers.length === 0) {
      console.warn('Countdown Timer: No timer containers found on page');
      return;
    }

    containers.forEach((container, index) => {
      console.log(`Countdown Timer: Initializing container ${index + 1}`, {
        id: container.id,
        productId: container.dataset.productId,
        shop: container.dataset.shop
      });

      // Check if already initialized
      if (container.dataset.initialized === 'true') {
        console.log('Countdown Timer: Container already initialized, skipping');
        return;
      }

      container.dataset.initialized = 'true';
      const timer = new CountdownTimer(container, {});
      timer.init();
    });
  }

  // Initialize when DOM is ready
  function initialize() {
    if (document.readyState === 'loading') {
      console.log('Countdown Timer: DOM loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', initTimers);
    } else {
      console.log('Countdown Timer: DOM ready, initializing immediately');
      initTimers();
    }
  }

  // Initialize immediately if script loads after DOM is ready
  initialize();

  // Also try after a short delay to catch dynamically loaded content
  setTimeout(initTimers, 100);
  setTimeout(initTimers, 500);

  // Re-initialize on dynamic content load (for AJAX navigation)
  if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', () => {
      console.log('Countdown Timer: Page shown, re-initializing');
      initTimers();
    });
  }

  console.log('Countdown Timer: Script loaded and initialized');
})();

