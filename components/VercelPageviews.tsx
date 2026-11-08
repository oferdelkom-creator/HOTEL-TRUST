'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { CONSENT_KEY, filterPageview, readConsent } from '@/lib/vercel-pageviews';

function beforeSend(event: BeforeSendEvent) {
  try { return filterPageview(event, window); } catch { return null; }
}

export default function VercelPageviews() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<'granted' | 'denied' | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try { setChoice(readConsent(window.localStorage)); } catch { setChoice(null); }
      setReady(true);
    };
    refresh();
    window.addEventListener('storage', refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => { window.removeEventListener('storage', refresh); window.clearInterval(timer); };
  }, []);

  function choose(value: 'granted' | 'denied') {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({value, at: Date.now()}));
      setChoice(value);
    } catch { setChoice(null); }
    setOpen(false);
  }

  // Never show or load analytics on a private/unknown route or a preview hostname.
  const publicHost = ready && ['www.hoteltrust.org'].includes(window.location.hostname);
  if (!publicHost || pathname !== '/') return null;

  return <>
    {choice === 'granted' && <Analytics beforeSend={beforeSend} debug={false} />}
    {(choice === null || open) ? <aside aria-label="Analytics preferences" dir="ltr"
      style={{position:'fixed',bottom:12,left:12,right:12,zIndex:1000,background:'#fff',color:'#172c28',border:'1px solid #b9c9c2',borderRadius:12,padding:16,boxShadow:'0 4px 20px #0002',maxWidth:600,margin:'0 auto',fontSize:14}}>
      <p lang="en" dir="ltr" style={{margin:'0 0 12px'}}>With your permission, Vercel Analytics counts visits to this public home page. We exclude account, booking, guest and hotel workspace pages and remove URL query parameters. No contact details or form content are sent. You can decline or withdraw at any time in Analytics preferences.</p>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <button type="button" onClick={() => choose('denied')}>Decline</button>
        <button type="button" onClick={() => choose('granted')}>Allow</button>
      </div>
    </aside> : <button type="button" onClick={() => setOpen(true)}
      style={{position:'fixed',bottom:8,left:8,zIndex:999,fontSize:12,background:'#fff',color:'#172c28',border:'1px solid #b9c9c2',borderRadius:8,padding:'4px 8px'}}>Analytics preferences</button>}
  </>;
}
