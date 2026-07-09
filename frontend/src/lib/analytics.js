import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const GA4_MEASUREMENT_ID = process.env.REACT_APP_GA4_MEASUREMENT_ID;

const getUtmParams = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  const searchParams = new URLSearchParams(window.location.search || '');
  const utmSource = searchParams.get('utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';
  const utmTerm = searchParams.get('utm_term') || '';
  const utmContent = searchParams.get('utm_content') || '';

  const payload = {
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_term: utmTerm,
    utm_content: utmContent
  };

  Object.entries(payload).forEach(([key, value]) => {
    if (value) {
      localStorage.setItem(`analytics_${key}`, value);
    }
  });

  return {
    utm_source: payload.utm_source || localStorage.getItem('analytics_utm_source') || '',
    utm_medium: payload.utm_medium || localStorage.getItem('analytics_utm_medium') || '',
    utm_campaign: payload.utm_campaign || localStorage.getItem('analytics_utm_campaign') || '',
    utm_term: payload.utm_term || localStorage.getItem('analytics_utm_term') || '',
    utm_content: payload.utm_content || localStorage.getItem('analytics_utm_content') || ''
  };
};

const getOrCreateId = (key, prefix) => {
  let value = localStorage.getItem(key);
  if (!value) {
    value = `${prefix}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(key, value);
  }
  return value;
};

export const getAnalyticsIds = () => ({
  anonymousId: getOrCreateId('analytics_anonymous_id', 'anon'),
  sessionId: getOrCreateId('analytics_session_id', 'sess')
});

export const initAnalytics = () => {
  if (!GA4_MEASUREMENT_ID || typeof window === 'undefined') {
    // Continue setting up first-party performance capture even without GA4.
  }

  if (typeof window !== 'undefined') {
    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    if (!window.gtag) {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }
  }

  if (GA4_MEASUREMENT_ID && !document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  if (GA4_MEASUREMENT_ID) {
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID, { send_page_view: false });
  }

  // Capture key web performance metrics once per browser session.
  if (sessionStorage.getItem('analytics_web_vitals_sent') === '1') {
    return;
  }

  const metrics = {
    fcp_ms: 0,
    lcp_ms: 0,
    cls: 0,
    ttfb_ms: 0
  };

  const navEntry = performance.getEntriesByType('navigation')[0];
  if (navEntry && typeof navEntry.responseStart === 'number') {
    metrics.ttfb_ms = Math.round(navEntry.responseStart);
  }

  const paintEntries = performance.getEntriesByName('first-contentful-paint');
  if (paintEntries && paintEntries[0]) {
    metrics.fcp_ms = Math.round(paintEntries[0].startTime);
  }

  let lcpValue = 0;
  let clsValue = 0;
  let lcpObserver;
  let clsObserver;

  if ('PerformanceObserver' in window) {
    try {
      lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const last = entries[entries.length - 1];
        if (last && typeof last.startTime === 'number') {
          lcpValue = Math.round(last.startTime);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // No-op
    }

    try {
      clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput && typeof entry.value === 'number') {
            clsValue += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // No-op
    }
  }

  const flushWebVitals = async () => {
    if (sessionStorage.getItem('analytics_web_vitals_sent') === '1') {
      return;
    }

    metrics.lcp_ms = lcpValue;
    metrics.cls = Number(clsValue.toFixed(4));

    await trackEvent('web_vitals', metrics);
    sessionStorage.setItem('analytics_web_vitals_sent', '1');

    if (lcpObserver && typeof lcpObserver.disconnect === 'function') {
      lcpObserver.disconnect();
    }
    if (clsObserver && typeof clsObserver.disconnect === 'function') {
      clsObserver.disconnect();
    }
  };

  // Let browser settle before sending metrics.
  setTimeout(() => {
    flushWebVitals();
  }, 6000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushWebVitals();
    }
  });
};

export const trackEvent = async (eventName, params = {}) => {
  try {
    const { anonymousId, sessionId } = getAnalyticsIds();
    const utmParams = getUtmParams();
    const enrichedParams = {
      ...utmParams,
      ...params
    };

    if (typeof window !== 'undefined' && window.gtag && GA4_MEASUREMENT_ID) {
      window.gtag('event', eventName, enrichedParams);
    }

    await axios.post(`${API}/analytics/event`, {
      event_name: eventName,
      anonymous_id: anonymousId,
      session_id: sessionId,
      page_path: typeof window !== 'undefined' ? window.location.pathname : null,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      params: enrichedParams
    });
  } catch (error) {
    // Tracking should never block UX.
  }
};

export const trackPageView = async (path) => {
  await trackEvent('page_view', {
    path,
    title: typeof document !== 'undefined' ? document.title : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    location_search: typeof window !== 'undefined' ? window.location.search : ''
  });
};
