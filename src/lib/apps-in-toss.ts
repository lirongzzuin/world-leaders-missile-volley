/**
 * Apps-in-Toss SDK wrapper.
 *
 * The SDK is NOT installed as a package. The Toss shell injects it at runtime
 * into window.__APPS_IN_TOSS__. We access it purely through that global so we
 * never need to import the package at build time.
 *
 * isTossApp()  → checks for window.__APPS_IN_TOSS__ global
 * All functions fall back to safe mocks when running outside the Toss WebView.
 *
 * @module apps-in-toss
 */

import logger from './logger';

// ─── Internal: typed access to the injected global ───────────────────────────

interface AdMobInstance {
  load(): void;
  show(): void;
  onEvent(event: 'loaded' | 'rewarded' | 'closed' | 'error', cb: () => void): void;
}

interface TossSDK {
  appLogin(): Promise<{ authorizationCode: string; referrer?: string }>;
  share(opts: { message: string }): Promise<void>;
  contactsViral(): Promise<void>;
  getTossShareLink?(url: string, ogImageUrl?: string): string;
  GoogleAdMob?: {
    create(unitId: string): AdMobInstance;
  };
}

function getTossSDK(): TossSDK | null {
  if (typeof window === 'undefined') return null;
  const sdk = (window as unknown as Record<string, unknown>)['__APPS_IN_TOSS__'];
  return sdk ? (sdk as TossSDK) : null;
}

// ─── Environment detection ────────────────────────────────────────────────────

export function isTossApp(): boolean {
  return getTossSDK() !== null;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface TossLoginResult {
  authorizationCode: string;
  referrer?: string;
}

/**
 * Trigger Toss OAuth login flow.
 * Returns { authorizationCode } — must be exchanged server-side for user info.
 */
export async function appLogin(): Promise<TossLoginResult> {
  const sdk = getTossSDK();
  if (!sdk) {
    logger.warn('appLogin() called outside Toss WebView — returning mock code');
    return { authorizationCode: 'mock_auth_code_' + Date.now() };
  }
  logger.info('Calling real Toss appLogin()');
  return sdk.appLogin();
}

// ─── Share ────────────────────────────────────────────────────────────────────

export async function share(message: string): Promise<void> {
  const sdk = getTossSDK();
  if (!sdk) {
    if (navigator.share) await navigator.share({ text: message });
    else await navigator.clipboard.writeText(message);
    return;
  }
  await sdk.share({ message });
}

// ─── Deep Link Share ──────────────────────────────────────────────────────────

/**
 * Generate a Toss deep link for sharing. Falls back to raw URL outside Toss.
 */
export function getTossShareLink(url: string, ogImageUrl?: string): string {
  const sdk = getTossSDK();
  if (sdk?.getTossShareLink) {
    return sdk.getTossShareLink(url, ogImageUrl);
  }
  return url;
}

// ─── Friend Invite (Contacts Viral) ──────────────────────────────────────────

/**
 * Open Toss contacts picker for viral friend invite.
 * No-op outside Toss WebView.
 */
export async function contactsViral(): Promise<void> {
  const sdk = getTossSDK();
  if (!sdk) {
    logger.warn('contactsViral() called outside Toss WebView — skipping');
    return;
  }
  logger.info('Opening Toss contacts viral');
  await sdk.contactsViral();
}

// ─── Rewarded Ad (Toss GoogleAdMob) ──────────────────────────────────────────

/**
 * Show a Toss GoogleAdMob rewarded ad. Resolves `true` if user watched the ad.
 * Falls back to resolving `false` outside Toss.
 */
export function showRewardedAd(unitId: string): Promise<boolean> {
  const sdk = getTossSDK();
  if (!sdk?.GoogleAdMob) {
    logger.warn('GoogleAdMob not available — skipping rewarded ad');
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const ad = sdk.GoogleAdMob!.create(unitId);

    ad.onEvent('loaded', () => {
      ad.show();
    });

    ad.onEvent('rewarded', () => {
      resolve(true);
    });

    ad.onEvent('closed', () => {
      resolve(false);
    });

    ad.onEvent('error', () => {
      logger.error('Rewarded ad error');
      resolve(false);
    });

    ad.load();
  });
}

// ─── Back button (Android hardware back) ─────────────────────────────────────

export function registerBackHandler(handler: () => void): () => void {
  const onPopState = () => handler();
  window.addEventListener('popstate', onPopState);
  window.history.pushState(null, '', window.location.href);
  return () => window.removeEventListener('popstate', onPopState);
}
