import type { PortfolioOSConfig } from './types.js'

/**
 * Signal capture: how the page learns which audience a visitor belongs to.
 *
 * The engine stays vendor-agnostic by talking to an injected `AnalyticsAdapter`
 * instead of importing any analytics SDK. Pass it a thin wrapper around
 * whatever you use (PostHog, Segment, a fetch to your own endpoint, etc.).
 */

/** The minimal analytics surface the engine touches. */
export interface AnalyticsAdapter {
  /** Record an event with optional properties. */
  capture: (event: string, props?: Record<string, unknown>) => void
  /**
   * Persist properties on the current visitor (e.g. their resolved audience),
   * so a targeting flag can read it without recomputing the cohort. Optional.
   */
  setPersonProperties?: (props: Record<string, unknown>) => void
}

/**
 * Record an interest signal. Two things happen when an adapter is present:
 *   1. the configured `signalEvent` fires (so downstream analytics / a nightly
 *      job can measure which cohorts convert), and
 *   2. the visitor's `audience` person-property is set to the cohort, which a
 *      targeting flag can read instantly with no cohort-recalculation lag.
 *
 * Last write wins: the most recent intent a visitor shows is the one served.
 * Safe to call with a null adapter (e.g. before analytics has loaded).
 */
export function captureAudienceSignal<C extends string, P>(
  adapter: AnalyticsAdapter | null | undefined,
  config: PortfolioOSConfig<C, P>,
  cohort: C,
  context: string,
  meta: Record<string, unknown> = {}
): void {
  if (!adapter) return
  adapter.capture(config.signalEvent, { cohort, context, ...meta })
  adapter.setPersonProperties?.({ audience: cohort })
}
