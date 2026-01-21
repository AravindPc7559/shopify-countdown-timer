(function () {
  'use strict';

  const createElement = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };

  class CountdownTimer {
    constructor(container) {
      this.container = container;
      this.timer = null;
      this.intervalId = null;
      this.isUrgent = false;
      this.impressionTracked = false;
    }

    async init() {
      try {
        await this.fetchTimer();
      } catch (error) {
        this.container.style.display = 'none';
      }
    }

    async fetchTimer() {
      let productId = this.container.dataset.productId;
      const shop = this.container.dataset.shop;
      let apiUrl = this.container.dataset.apiUrl;

      if (!productId || !shop) {
        this.container.style.display = 'none';
        return;
      }

      if (productId.includes('/')) {
        productId = productId.split('/').pop();
      }

      if (!apiUrl || !apiUrl.trim()) {
        const apiUrlMeta = document.querySelector('meta[name="countdown-timer-api-url"]');
        apiUrl = apiUrlMeta ? apiUrlMeta.getAttribute('content') : null;
        
        if (!apiUrl) {
          this.container.style.display = 'none';
          return;
        }
      }

      try {
        const endpoint = `${apiUrl}/api/timers/public/${productId}?shop=${encodeURIComponent(shop)}`;
        const response = await fetch(endpoint, {
          method: 'GET',
          mode: 'cors',
          cache: 'default',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.timer) {
          this.timer = data.timer;
          this.container.style.display = 'block';
          this.render();
          this.startCountdown();
          this.trackImpression();
        } else {
          this.container.style.display = 'none';
        }
      } catch (error) {
        this.container.style.display = 'none';
      }
    }

    trackImpression() {
      if (this.impressionTracked || !this.timer) return;

      let apiUrl = this.container.dataset.apiUrl;
      if (!apiUrl) {
        const apiUrlMeta = document.querySelector('meta[name="countdown-timer-api-url"]');
        apiUrl = apiUrlMeta ? apiUrlMeta.getAttribute('content') : null;
      }

      if (!apiUrl) return;

      const url = `${apiUrl}/api/timers/public/impression?timerId=${encodeURIComponent(this.timer.id)}`;
      
      fetch(url, { method: 'GET', mode: 'cors' })
        .catch(() => {});

      this.impressionTracked = true;
    }

    getRemainingTime() {
      if (!this.timer) return null;

      let endTime;

      if (this.timer.type === 'evergreen') {
        const storageKey = `countdown_timer_${this.timer.id}`;
        let startTime = localStorage.getItem(storageKey);

        if (!startTime) {
          startTime = Date.now();
          localStorage.setItem(storageKey, startTime.toString());
        }

        endTime = parseInt(startTime) + (this.timer.duration * 1000);
      } else {
        endTime = new Date(this.timer.endDate).getTime();
      }

      const remaining = Math.max(0, endTime - Date.now());

      if (remaining === 0 && this.timer.type === 'evergreen') {
        localStorage.removeItem(`countdown_timer_${this.timer.id}`);
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

    createTimeUnit(unit, value) {
      const unitEl = createElement('div', `countdown-timer-unit countdown-timer-${unit}`);
      const valueEl = createElement('span', 'countdown-timer-value', value);
      const labelEl = createElement('span', 'countdown-timer-label', unit.charAt(0).toUpperCase() + unit.slice(1));
      
      unitEl.appendChild(valueEl);
      unitEl.appendChild(labelEl);
      return unitEl;
    }

    render() {
      const remaining = this.getRemainingTime();

      if (remaining === null || remaining === 0) {
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

      const wasUrgent = this.isUrgent;
      this.isUrgent = hoursTotal < 1 && hoursTotal >= 0;

      this.container.style.backgroundColor = backgroundColor;
      this.container.style.color = textColor;
      this.container.style.display = 'block';

      if (this.isUrgent && !wasUrgent) {
        this.container.classList.add('countdown-timer-urgent');
      } else if (!this.isUrgent) {
        this.container.classList.remove('countdown-timer-urgent');
      }

      this.container.className = this.container.className.replace(/countdown-timer-position-\w+/g, '');
      this.container.classList.add(`countdown-timer-position-${position}`);

      const existingDisplay = this.container.querySelector('.countdown-timer-display');
      if (existingDisplay) {
        existingDisplay.remove();
      }

      const display = createElement('div', 'countdown-timer-display');
      const textEl = createElement('div', 'countdown-timer-text', text);
      const timeEl = createElement('div', 'countdown-timer-time');

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

    startCountdown() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }

      this.render();

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

  function initTimers() {
    const containers = document.querySelectorAll('.countdown-timer-container[data-product-id]');

    containers.forEach((container) => {
      if (container.dataset.initialized === 'true') {
        return;
      }

      container.dataset.initialized = 'true';
      const timer = new CountdownTimer(container);
      timer.init();
    });
  }

  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTimers);
    } else {
      initTimers();
    }
  }

  initialize();

  if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', initTimers);
    
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        initTimers();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
})();
