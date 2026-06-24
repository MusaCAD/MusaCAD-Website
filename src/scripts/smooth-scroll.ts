/**
 * Site-wide smooth scrolling: Lenis driving GSAP's ScrollTrigger.
 *
 * Lenis owns the scroll position (lerped, buttery), and we feed its RAF loop
 * through GSAP's ticker so ScrollTrigger stays perfectly in sync with the
 * smoothed scroll — no double RAF loops, no jitter.
 *
 * Respects `prefers-reduced-motion`: when the user asks for less motion we skip
 * Lenis entirely and let ScrollTrigger run against the browser's native scroll,
 * so anchored navigation and any scroll-based reveals still work — just without
 * the inertia.
 */
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let lenis: Lenis | null = null;

export function initSmoothScroll(): Lenis | null {
  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    // Native scroll only — ScrollTrigger still works, just no smoothing.
    return null;
  }

  lenis = new Lenis({
    duration: 1.1, // seconds for the scroll to "catch up" — the inertia feel
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
  });

  // Keep ScrollTrigger informed on every Lenis frame.
  lenis.on('scroll', ScrollTrigger.update);

  // Drive Lenis from GSAP's ticker (single source of truth for time).
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000); // GSAP ticker is in seconds; Lenis wants ms.
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

/** Smoothly scroll to an element or selector (used by anchored nav links). */
export function scrollTo(target: string | HTMLElement, offset = 0): void {
  if (lenis) {
    lenis.scrollTo(target, { offset });
  } else {
    const el =
      typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function getLenis(): Lenis | null {
  return lenis;
}
