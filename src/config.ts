import type { PortfolioOSConfig } from './types.js'

/**
 * Identity helper that preserves a config's inferred generic parameters. Wrap
 * your config in this so `C` (cohorts) and `P` (payload) are inferred and the
 * rest of the engine is fully typed against your specific site.
 */
export function defineConfig<C extends string, P>(
  config: PortfolioOSConfig<C, P>
): PortfolioOSConfig<C, P> {
  return config
}

/**
 * Validate a config for the invariants the engine relies on. Returns an array
 * of human-readable error strings; an empty array means the config is sound.
 *
 * Call this once at startup (e.g. in a test or a boot check) rather than on
 * every request. It never throws.
 */
export function validateConfig<C extends string, P>(
  config: PortfolioOSConfig<C, P>
): string[] {
  const errors: string[] = []

  if (config.cohorts.length === 0) {
    errors.push('cohorts must not be empty')
  }
  if (!config.cohorts.includes(config.defaultCohort)) {
    errors.push(`defaultCohort "${config.defaultCohort}" is not listed in cohorts`)
  }
  for (const cohort of config.cohorts) {
    if (!Object.prototype.hasOwnProperty.call(config.personas, cohort)) {
      errors.push(`missing persona for cohort "${cohort}"`)
    }
  }
  if (config.payloadKeys.length === 0) {
    errors.push('payloadKeys must not be empty (no field could ever be overridden)')
  }
  if (config.tagRouting) {
    if (!config.cohorts.includes(config.tagRouting.fallback)) {
      errors.push(`tagRouting.fallback "${config.tagRouting.fallback}" is not a known cohort`)
    }
    for (const rule of config.tagRouting.rules) {
      if (!config.cohorts.includes(rule.cohort)) {
        errors.push(`tagRouting rule cohort "${rule.cohort}" is not a known cohort`)
      }
    }
  }
  if (config.channelRouting) {
    for (const [channel, cohort] of Object.entries(config.channelRouting)) {
      if (cohort !== null && !config.cohorts.includes(cohort)) {
        errors.push(`channelRouting["${channel}"] cohort "${cohort}" is not a known cohort`)
      }
    }
  }

  return errors
}
