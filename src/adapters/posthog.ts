import type { AnalyticsAdapter } from '../signals.js'
import type { PortfolioOSConfig, ResolveInput } from '../types.js'

/**
 * Optional PostHog adapter. Dependency-free: it is typed against a structural
 * subset of `posthog-js`, so this package never imports or bundles PostHog.
 * Pass your real `posthog` instance and it satisfies the shape.
 *
 * No keys, hosts, or project ids live here. Configure PostHog itself from your
 * own environment variables (e.g. NEXT_PUBLIC_POSTHOG_KEY) in your app, never
 * in this package.
 */

/** The minimal slice of a posthog-js client this adapter uses. */
export interface PostHogLike {
  getFeatureFlag: (key: string) => string | boolean | undefined
  getFeatureFlagPayload: (key: string) => unknown
  capture: (event: string, props?: Record<string, unknown>) => void
  setPersonProperties?: (props: Record<string, unknown>) => void
}

/** Wrap a posthog-js client as an `AnalyticsAdapter` for signal capture. */
export function posthogAnalytics(posthog: PostHogLike): AnalyticsAdapter {
  return {
    capture: (event, props) => posthog.capture(event, props),
    setPersonProperties: (props) => posthog.setPersonProperties?.(props),
  }
}

/**
 * Read the flags and payloads `resolveContent` needs out of a posthog client.
 *
 * Reads only the two flags named in the config, narrowing each to the
 * `string | boolean` the engine expects, and pulls the personalize flag's
 * payload. Returns a partial `ResolveInput` you can spread into your own
 * resolve call (add `abTestContent` and `ambush` as needed).
 */
export function readPostHogInput<C extends string, P>(
  config: PortfolioOSConfig<C, P>,
  posthog: PostHogLike
): Pick<ResolveInput<P>, 'flags' | 'payloads'> {
  const flags: Record<string, string | boolean> = {}

  for (const key of [config.flags.personalize, config.flags.headline]) {
    const value = posthog.getFeatureFlag(key)
    if (typeof value === 'string' || typeof value === 'boolean') {
      flags[key] = value
    }
  }

  const payloads: Record<string, unknown> = {
    [config.flags.personalize]: posthog.getFeatureFlagPayload(config.flags.personalize),
  }

  return { flags, payloads }
}
