/**
 * portfolio-os: a config-driven, framework-agnostic engine for the 5-level
 * "living landing page" - a page that watches visitors, A/B tests itself,
 * auto-iterates its copy from runtime flag payloads, and personalizes per
 * audience cohort (down to a single named lead via ambush mode).
 *
 * The core has no runtime dependencies and no vendor lock-in. Analytics and
 * feature-flag providers are injected as adapters. See ./adapters for an
 * optional, dependency-free PostHog binding.
 */

export type {
  ABVariant,
  FieldValidator,
  TagRule,
  TagRouting,
  PortfolioOSConfig,
  AmbushEntry,
  ResolvedContent,
  ResolveInput,
} from './types.js'

export {
  cohortFromFlag,
  resolveContent,
  resolveCohortByTags,
  resolveCohortByChannel,
} from './engine.js'

export { DEFAULT_SLUG_PATTERN, resolveAmbush } from './ambush.js'

export { captureAudienceSignal } from './signals.js'
export type { AnalyticsAdapter } from './signals.js'

export { defineConfig, validateConfig } from './config.js'
