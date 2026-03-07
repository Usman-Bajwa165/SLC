/**
 * progress.ts — Global progress bar utility
 * Import `showBar` / `hideBar` anywhere in the app to manually
 * trigger the golden top loading bar for actions not covered by
 * React Query (e.g. file uploads, print, CSV export).
 *
 * Usage:
 *   import { showBar, hideBar } from '@/lib/progress';
 *   showBar();
 *   await doSomething();
 *   hideBar();
 */

export { showBar, hideBar } from "@/components/layout/TopLoader";
