import type { BeforeSendEvent } from '@vercel/analytics/next';

export const CONSENT_KEY = 'hoteltrust_vercel_analytics_consent';
export const CONSENT_AGE = 180 * 24 * 60 * 60 * 1000;
export function readConsent(storage: Pick<Storage, 'getItem'>, now = Date.now()): 'granted' | 'denied' | null {
  try {
    const saved = JSON.parse(storage.getItem(CONSENT_KEY) || 'null');
    if (!saved || typeof saved.at !== 'number' || saved.at > now || now - saved.at > CONSENT_AGE) return null;
    return saved.value === 'granted' || saved.value === 'denied' ? saved.value : null;
  } catch { return null; }
}

// Only the public landing page. Directory, activities, accounts and every unknown route are excluded.
export function filterPageview(event: BeforeSendEvent, browser: {location: {href: string}; document: {referrer: string}; localStorage: Pick<Storage, 'getItem'>}) {
  if (event.type !== 'pageview' || readConsent(browser.localStorage) !== 'granted') return null;
  try {
    const current = new URL(browser.location.href), url = new URL(event.url);
    if (!['www.hoteltrust.org'].includes(current.hostname) ||
        current.protocol !== 'https:' || url.origin !== current.origin ||
        current.pathname !== '/' || url.pathname !== '/') return null;
    if (browser.document.referrer) {
      const referrer = new URL(browser.document.referrer);
      if (referrer.search || referrer.hash || referrer.pathname !== '/') return null;
    }
    return {type: 'pageview' as const, url: url.origin + url.pathname};
  } catch { return null; }
}
