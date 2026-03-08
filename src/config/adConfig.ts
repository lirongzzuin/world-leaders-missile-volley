/**
 * Advertisement slot configuration.
 * All ad slot IDs come from environment variables — never hardcode.
 *
 * @module adConfig
 */

export type AdSlot =
  | 'lobby_banner'       // 320×50 fixed bottom banner on lobby
  | 'loading_interstitial' // Full-screen before match
  | 'set_break_banner'    // Between sets (auto-close 3s)
  | 'result_interstitial'; // Full-screen on result screen

export type AdProvider = 'kakao_adfit' | 'google_adsense' | 'none';

export interface AdSlotConfig {
  slot: AdSlot;
  provider: AdProvider;
  /** Provider-specific slot/unit ID from env */
  unitId: string;
  width: number;
  height: number;
  /** Auto-close delay in ms (0 = manual close only) */
  autoCloseMs: number;
}

function envOr(key: string): string {
  return (typeof process !== 'undefined' && process.env[key]) || '';
}

export const AD_SLOTS: Record<AdSlot, AdSlotConfig> = {
  lobby_banner: {
    slot: 'lobby_banner',
    provider: 'kakao_adfit',
    unitId: envOr('NEXT_PUBLIC_ADFIT_LOBBY_UNIT_ID'),
    width: 320,
    height: 50,
    autoCloseMs: 0,
  },
  loading_interstitial: {
    slot: 'loading_interstitial',
    provider: 'kakao_adfit',
    unitId: envOr('NEXT_PUBLIC_ADFIT_LOADING_UNIT_ID'),
    width: 320,
    height: 480,
    autoCloseMs: 5000,
  },
  set_break_banner: {
    slot: 'set_break_banner',
    provider: 'google_adsense',
    unitId: envOr('NEXT_PUBLIC_ADSENSE_SET_UNIT_ID'),
    width: 320,
    height: 100,
    autoCloseMs: 3000,
  },
  result_interstitial: {
    slot: 'result_interstitial',
    provider: 'google_adsense',
    unitId: envOr('NEXT_PUBLIC_ADSENSE_RESULT_UNIT_ID'),
    width: 320,
    height: 480,
    autoCloseMs: 0,
  },
};
