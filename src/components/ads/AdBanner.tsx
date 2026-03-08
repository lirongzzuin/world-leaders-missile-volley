'use client';

/**
 * Ad banner abstraction component.
 * Swap ad providers by editing this file only.
 * All slot IDs come from adConfig (env-based).
 *
 * @module AdBanner
 */

import { useEffect, useRef } from 'react';
import { AD_SLOTS, type AdSlot } from '@/config/adConfig';

interface Props {
  slot: AdSlot;
  className?: string;
}

export default function AdBanner({ slot, className = '' }: Props) {
  const config = AD_SLOTS[slot];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!config.unitId || config.unitId === '') return; // no unit ID configured yet

    if (config.provider === 'kakao_adfit') {
      // Kakao AdFit — inject ins tag and trigger push
      const ins = document.createElement('ins');
      ins.className = 'kakao_ad_area';
      ins.setAttribute('style', 'display:none;');
      ins.setAttribute('data-ad-unit', config.unitId);
      ins.setAttribute('data-ad-width', String(config.width));
      ins.setAttribute('data-ad-height', String(config.height));
      containerRef.current?.appendChild(ins);

      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
      script.async = true;
      containerRef.current?.appendChild(script);
    } else if (config.provider === 'google_adsense') {
      // Google AdSense — push to adsbygoogle array
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.setAttribute('style', `display:inline-block;width:${config.width}px;height:${config.height}px`);
      ins.setAttribute('data-ad-client', process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ?? '');
      ins.setAttribute('data-ad-slot', config.unitId);
      containerRef.current?.appendChild(ins);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    }
  }, [config]);

  if (!config.unitId) {
    // Placeholder during development
    return (
      <div
        className={`flex items-center justify-center bg-card-dark border border-primary/10 text-primary/30 text-xs font-mono ${className}`}
        style={{ width: config.width, height: config.height }}
      >
        [AD: {slot}]
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
