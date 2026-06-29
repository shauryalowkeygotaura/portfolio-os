/**
 * EXAMPLE usage: resolving hero copy for one request, server-side.
 *
 * In your own project import from 'portfolio-os'. This file imports from the
 * source so the repo type-checks in one pass.
 */
import { resolveContent, resolveAmbush, captureAudienceSignal } from '../src/index.js'
import type { AnalyticsAdapter } from '../src/index.js'
import { portfolioConfig, ambushRegistry, type HeroCopy } from './portfolio.config.js'

// Inputs you would gather per request (flags from your provider, ?from= slug).
const flags = { 'lp-personalize': 'engineer', 'hero-headline': 'control' }
const payloads = { 'lp-personalize': { headline: 'Voice AI at $0.00/min, in the open.' } }
const ambush = resolveAmbush(ambushRegistry, 'smile-dental-jaipur')

const abTestContent: Partial<HeroCopy> = {
  headline: 'I ship AI that pays for itself.',
  cta: 'See the Numbers',
}

const resolved = resolveContent(portfolioConfig, {
  flags,
  payloads,
  abTestContent,
  ambush,
})

// resolved.cohort, resolved.abVariant, resolved.content are all strongly typed.
const hero: HeroCopy = resolved.content
void hero

// Capturing a signal later, when the visitor reveals intent (client-side).
// Wrap whatever analytics client you use; here a trivial in-memory sink.
const events: Array<{ event: string; props?: Record<string, unknown> }> = []
const analytics: AnalyticsAdapter = {
  capture: (event, props) => {
    events.push({ event, props })
  },
}
captureAudienceSignal(analytics, portfolioConfig, 'client', 'clicked_live_demo')
void events
