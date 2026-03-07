"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

// ── Shared imperative API ─────────────────────────────────────────────────────
// We create the bar once in the DOM and drive it imperatively to avoid
// any SSR / hydration mismatches.
const BAR_ID = "slc-progress-bar";

function ensureBar(): HTMLDivElement {
  let bar = document.getElementById(BAR_ID) as HTMLDivElement | null;
  if (!bar) {
    bar = document.createElement("div");
    bar.id = BAR_ID;
    Object.assign(bar.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "0%",
      height: "3px",
      background: "linear-gradient(90deg, #D4AF37, #f0d060, #D4AF37)",
      boxShadow: "0 0 12px rgba(212, 175, 55, 0.8)",
      zIndex: "9999",
      opacity: "0",
      transition: "width 500ms ease, opacity 300ms ease",
      pointerEvents: "none",
    });
    document.body.appendChild(bar);
  }
  return bar;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function showBar() {
  if (typeof document === "undefined") return;
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  const bar = ensureBar();
  // Ratchet forward: only advance, never go backward
  const current = parseFloat(bar.style.width) || 0;
  bar.style.opacity = "1";
  bar.style.width = Math.min(current + 30, 85) + "%";
}

export function hideBar() {
  if (typeof document === "undefined") return;
  const bar = ensureBar();
  bar.style.width = "100%";
  hideTimer = setTimeout(() => {
    if (bar) {
      bar.style.opacity = "0";
      setTimeout(() => {
        if (bar) bar.style.width = "0%";
      }, 350);
    }
  }, 200);
}

// ── Route-change loader (Suspense-safe) ───────────────────────────────────────
export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    showBar();
    const t = setTimeout(hideBar, 500);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return null; // No DOM output — bar lives outside React tree
}

// ── Query-aware loader (fires on ALL fetches + mutations) ─────────────────────
export function GlobalProgressBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;
  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current) {
      showBar();
    } else if (!active && prevActive.current) {
      hideBar();
    }
    prevActive.current = active;
  }, [active]);

  return null;
}
