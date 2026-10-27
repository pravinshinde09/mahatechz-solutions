"use client";

import { setNonce } from "get-nonce";

/**
 * Radix dialogs and sheets lock scrolling by injecting a <style> tag (react-remove-scroll). Under
 * our nonce-based CSP that tag needs the request's nonce, which react-remove-scroll reads from
 * `get-nonce`. Rendered once in the root layout, before any sheet can open.
 */
export function StyleNonce({ nonce }: { nonce: string | undefined }) {
  if (nonce) setNonce(nonce);
  return null;
}
