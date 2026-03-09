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
  // Ensure visibility and start from a reasonable point if hidden
  if (bar.style.opacity === "0" || bar.style.width === "0%") {
    bar.style.transition = "none";
    bar.style.width = "0%";
    bar.style.opacity = "1";
    // Force reflow
    bar.offsetHeight;
    bar.style.transition = "width 500ms ease, opacity 300ms ease";
  }

  const current = parseFloat(bar.style.width) || 0;
  bar.style.width = Math.min(current + 25, 90) + "%";
}

export function hideBar() {
  if (typeof document === "undefined") return;
  const bar = ensureBar();
  bar.style.width = "100%";
  hideTimer = setTimeout(() => {
    if (bar) {
      bar.style.opacity = "0";
      setTimeout(() => {
        if (bar) {
          bar.style.transition = "none";
          bar.style.width = "0%";
          // Force reflow
          bar.offsetHeight;
          bar.style.transition = "width 500ms ease, opacity 300ms ease";
        }
      }, 350);
    }
  }, 250);
}

// ── Route-change loader (Suspense-safe) ───────────────────────────────────────
export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Intercept clicks on links globally to show bar IMMEDIATELY
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (
        anchor &&
        anchor.href &&
        !anchor.target &&
        anchor.origin === window.location.origin
      ) {
        showBar();
      }
    };

    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    // When route actually changes, hide the bar
    const t = setTimeout(hideBar, 400);
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
