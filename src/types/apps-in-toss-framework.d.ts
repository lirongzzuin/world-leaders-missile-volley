/**
 * Type shim for @apps-in-toss/web-framework.
 * The actual package is NOT installed — it is injected by the Toss shell at runtime.
 * This file provides TypeScript types so our code can reference it safely.
 */
declare module '@apps-in-toss/web-framework' {
  export interface AppLoginResult {
    authorizationCode: string;
    referrer?: string;
  }

  export interface TossShareOptions {
    message: string;
  }

  export interface PurchaseEventPayload {
    type: 'loaded' | 'rewarded' | 'closed' | 'error';
    orderId?: string;
  }

  export interface OneTimePurchaseOptions {
    options: {
      sku: string;
      processProductGrant: string;
    };
    onEvent: (payload: PurchaseEventPayload) => void;
    onError: (error: Error) => void;
  }

  export interface CompleteProductGrantOptions {
    params: { orderId: string };
  }

  // Minimal surface we actually use
  export function appLogin(): Promise<AppLoginResult>;
  export function share(opts: TossShareOptions): Promise<void>;
  export function createOneTimePurchaseOrder(opts: OneTimePurchaseOptions): () => void;
  export function completeProductGrant(opts: CompleteProductGrantOptions): Promise<void>;
  export function contactsViral(): Promise<void>;
}
