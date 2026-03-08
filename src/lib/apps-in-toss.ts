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

interface TossSDK {
  appLogin(): Promise<{ authorizationCode: string; referrer?: string }>;
  share(opts: { message: string }): Promise<void>;
  contactsViral(): Promise<void>;
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

// ─── Back button (Android hardware back) ─────────────────────────────────────

export function registerBackHandler(handler: () => void): () => void {
  const onPopState = () => handler();
  window.addEventListener('popstate', onPopState);
  window.history.pushState(null, '', window.location.href);
  return () => window.removeEventListener('popstate', onPopState);
}
