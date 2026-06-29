import type {
  ABVariant,
  PortfolioOSConfig,
  ResolveInput,
  ResolvedContent,
} from './types.js'

/**
 * The generic, config-driven personalization engine.
 *
 * All behaviour here is parameterised by a `PortfolioOSConfig`, so the same
 * code can power any site by swapping the config object. There are no secrets,
 * no vendor SDKs, and no framework imports in this module.
 */

/** Type guard: is `value` one of the config's known cohorts? */
function isCohort<C extends string, P>(
  config: PortfolioOSConfig<C, P>,
  value: unknown
): value is C {
  return typeof value === 'string' && (config.cohorts as ReadonlyArray<string>).includes(value)
}

/** Narrow an arbitrary flag value to a known cohort, falling back to default. */
export function cohortFromFlag<C extends string, P>(
  config: PortfolioOSConfig<C, P>,
  value: unknown
): C {
  return isCohort(config, value) ? value : config.defaultCohort
}

/**
 * Merge a partial override onto a base payload, honouring the config whitelist
 * and any per-field validators. Keys outside `payloadKeys`, missing keys,
 * null/undefined values, and values that fail a validator are all ignored.
 *
 * This is the single chokepoint where untrusted runtime data (flag payloads,
 * ambush copy) is allowed to influence rendered content, so it whitelists
 * rather than sanitizes.
 */
function mergePayload<C extends string, P>(
  config: PortfolioOSConfig<C, P>,
  base: P,
  patch: unknown
): P {
  if (!patch || typeof patch !== 'object') return base
  const source = patch as Record<string, unknown>
  const out: P = { ...base }
  for (const key of config.payloadKeys) {
    const name = key as string
    if (!Object.prototype.hasOwnProperty.call(source, name)) continue
    const value = source[name]
    if (value === undefined || value === null) continue
    const validate = config.validators?.[key]
    if (validate && !validate(value)) continue
    ;(out as Record<string, unknown>)[name] = value
  }
  return out
}

/**
 * Resolve the content for one visitor, server-side, with zero flicker.
 *
 * Precedence (later layers win):
 *   1. `config.personas[cohort]` - safe coded default for the resolved cohort.
 *   2. the headline A/B test       - only applies to the default cohort.
 *   3. the personalize flag payload - runtime copy a flag/AI/UI provides.
 *   4. ambush                       - a hand-written override for one named lead.
 *
 * The resolved cohort is the ambush's cohort if it sets one, otherwise the
 * cohort carried by the personalize flag, otherwise the default.
 */
export function resolveContent<C extends string, P>(
  config: PortfolioOSConfig<C, P>,
  input: ResolveInput<P>
): ResolvedContent<C, P> {
  const flags = input.flags ?? {}
  const payloads = input.payloads ?? {}

  const flagCohort = cohortFromFlag(config, flags[config.flags.personalize])
  const ambushCohort = input.ambush?.cohort
  const cohort: C = isCohort(config, ambushCohort) ? ambushCohort : flagCohort

  const abVariant: ABVariant = flags[config.flags.headline] === 'test' ? 'test' : 'control'

  // 1. coded default for the cohort.
  let content: P = { ...config.personas[cohort] }

  // 2. the default cohort is where the A/B test lives.
  if (cohort === config.defaultCohort && abVariant === 'test' && input.abTestContent) {
    content = mergePayload(config, content, input.abTestContent)
  }

  // 3. runtime payload from the personalize flag overrides any field it sets.
  content = mergePayload(config, content, payloads[config.flags.personalize])

  // 4. ambush wins last: a hand-written override for this exact lead.
  if (input.ambush) {
    content = mergePayload(config, content, input.ambush.copy)
  }

  return { cohort, abVariant, content }
}

/**
 * Resolve a cohort from a set of tags (e.g. the tags on a clicked project).
 * The first matching tag rule wins; otherwise the routing fallback is used.
 * Returns the default cohort when no tag routing is configured.
 */
export function resolveCohortByTags<C extends string, P>(
  config: PortfolioOSConfig<C, P>,
  tags: ReadonlyArray<string>
): C {
  const routing = config.tagRouting
  if (!routing) return config.defaultCohort
  for (const rule of routing.rules) {
    if (tags.some((tag) => rule.pattern.test(tag))) return rule.cohort
  }
  return routing.fallback
}

/**
 * Map a contact / social channel to the cohort it implies. Returns null when
 * the channel carries no strong intent or no channel routing is configured.
 */
export function resolveCohortByChannel<C extends string, P>(
  config: PortfolioOSConfig<C, P>,
  channel: string
): C | null {
  const map = config.channelRouting
  if (!map) return null
  return map[channel.toLowerCase()] ?? null
}
