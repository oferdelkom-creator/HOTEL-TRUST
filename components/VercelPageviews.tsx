'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { CONSENT_KEY, filterPageview, readConsent } from '@/lib/vercel-pageviews';

const CF_CONSENT = 'hoteltrust_cloudflare_analytics_v1';
const CF_AGE = 180 * 24 * 60 * 60 * 1000;
function readCloudflareConsent(): 'granted' | 'denied' | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CF_CONSENT) || 'null');
    const age = Date.now() - saved?.at;
    return age >= 0 && age <= CF_AGE && (saved?.value === 'granted' || saved?.value === 'denied') ? saved.value : null;
  } catch { return null; }
}

function loadCloudflareAnalytics() {
  const here = window.location;
  if (here.protocol !== 'https:' || here.hostname !== 'www.hoteltrust.org' || !(here.pathname === '/') || here.search || here.hash || window.parent !== window) return;
  try {
    if (document.referrer) {
      const from = new URL(document.referrer);
      if (from.protocol !== 'https:' || from.search || from.hash || from.pathname !== '/') return;
    }
  } catch { return; }
  if (document.querySelector('script[data-fh-cf-analytics]')) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-fh-cf-analytics', 'true');
  script.setAttribute('data-cf-beacon', '{"token":"4c00367663fa47a1b4f62b6838500fdb","spa":false}');
  document.body.appendChild(script);
}

function beforeSend(event: BeforeSendEvent) {
  try { return filterPageview(event, window); } catch { return null; }
}

export default function VercelPageviews() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<'granted' | 'denied' | null>(null);
  const [cfChoice, setCfChoice] = useState<'granted' | 'denied' | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try { setChoice(readConsent(window.localStorage)); } catch { setChoice(null); }
      setCfChoice(readCloudflareConsent());
      setReady(true);
    };
    refresh();
    window.addEventListener('storage', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('storage', refresh); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (cfChoice === 'granted') loadCloudflareAnalytics();
    if (cfChoice === 'denied' && document.querySelector('script[data-fh-cf-analytics]')) window.location.reload();
  }, [cfChoice, pathname]);

  function choose(value: 'granted' | 'denied') {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({value, at: Date.now()}));
      setChoice(value);
      localStorage.setItem(CF_CONSENT, JSON.stringify({value, at: Date.now()}));
      setCfChoice(value);
    } catch { setChoice(null); }
    setOpen(false);
  }

  // Never show or load analytics on a private/unknown route or a preview hostname.
  const publicHost = ready && ['www.hoteltrust.org'].includes(window.location.hostname);
  if (!publicHost || pathname !== '/') return null;

  return <>
    {choice === 'granted' && <Analytics beforeSend={beforeSend} debug={false} />}
    {(choice === null || (choice === 'granted' && cfChoice === null) || open) ? <aside aria-label="Analytics preferences" dir="ltr"
      style={{position:'fixed',bottom:12,left:12,right:12,zIndex:1000,background:'#fff',color:'#172c28',border:'1px solid #b9c9c2',borderRadius:12,padding:16,boxShadow:'0 4px 20px #0002',maxWidth:600,margin:'0 auto',fontSize:14}}>
      <p lang="en" dir="ltr" style={{margin:'0 0 12px'}}>With your permission, Vercel Analytics and Cloudflare Web Analytics count visits to this public home page. Account, booking, guest and hotel workspace pages are excluded. Cloudflare does not use analytics cookies and is not loaded on URLs with query parameters or fragments. No contact details or form content are sent. You can decline or withdraw at any time in Analytics preferences.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <button type="button" onClick={() => choose('denied')}>Decline</button>
        <button type="button" onClick={() => choose('granted')}>Allow</button>
      </div>
    </aside> : <button type="button" onClick={() => setOpen(true)}
      style={{position:'fixed',bottom:8,left:8,zIndex:999,fontSize:12,background:'#fff',color:'#172c28',border:'1px solid #b9c9c2',borderRadius:8,padding:'4px 8px'}}>Analytics preferences</button>}
  </>;
}
