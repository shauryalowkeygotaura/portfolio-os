/**
 * Core types for the config-driven self-personalizing landing-page engine.
 *
 * The engine is generic over two things:
 *   - `C` the union of cohort names this site sorts visitors into
 *        (always including a default / first-time cohort).
 *   - `P` the per-cohort content payload (the copy object a cohort renders).
 *
 * Nothing here is tied to a specific framework, analytics vendor, or site.
 * A `PortfolioOSConfig` is the single declarative description of HOW one site
 * personalizes; swap the config and the same engine powers a different site.
 */

/** Which A/B variant the default cohort is currently being shown. */
export type ABVariant = 'control' | 'test'

/**
 * A field-level validator. Returns true when a runtime value (from a flag
 * payload or an ambush override) is allowed to overwrite a content field.
 * Use this to whitelist acceptable values instead of trusting arbitrary input.
 */
export type FieldValidator = (value: unknown) => boolean

/**
 * Maps a matched tag pattern to the cohort that tag implies. The first rule
 * whose pattern matches any of the visitor's tags wins.
 */
export interface TagRule<C extends string> {
  pattern: RegExp
  cohort: C
}

/** Tag-based routing: pattern rules plus a fallback when none match. */
export interface TagRouting<C extends string> {
  rules: ReadonlyArray<TagRule<C>>
  /** Cohort assigned when no rule matches (and at least one tag was present). */
  fallback: C
}

/**
 * The declarative personalization config for a single site.
 *
 * @typeParam C - union of cohort names (must include `defaultCohort`).
 * @typeParam P - the per-cohort content payload shape.
 */
export interface PortfolioOSConfig<C extends string, P> {
  /** Every cohort a visitor can be resolved into, including the default. */
  cohorts: ReadonlyArray<C>
  /** The first-time / unknown-visitor cohort. The A/B test lives on this one. */
  defaultCohort: C
  /** Safe coded copy per cohort, rendered before any runtime payload arrives. */
  personas: Record<C, P>
  /** The flag keys this site reads (e.g. from PostHog, LaunchDarkly, env). */
  flags: {
    /** Flag carrying the resolved cohort, and whose payload can override copy. */
    personalize: string
    /** Flag carrying the default-cohort headline A/B variant. */
    headline: string
  }
  /** Event name fired when a visitor reveals which audience they belong to. */
  signalEvent: string
  /**
   * Whitelist of payload fields a runtime source (flag payload, A/B copy, or
   * ambush) is allowed to override. Fields outside this list are ignored, so a
   * misconfigured or hostile payload can never inject unexpected keys.
   */
  payloadKeys: ReadonlyArray<keyof P>
  /**
   * Optional per-field validators. A field is only overridden when its
   * validator (if any) returns true for the incoming value.
   */
  validators?: Partial<Record<keyof P, FieldValidator>>
  /** Optional tag-to-cohort routing (e.g. a clicked project's tags). */
  tagRouting?: TagRouting<C>
  /** Optional channel-to-cohort routing (e.g. github -> engineer). */
  channelRouting?: Record<string, C | null>
}

/** A hand-curated override for one named lead (ambush mode). */
export interface AmbushEntry<C extends string, P> {
  /**
   * Cohort whose coded defaults seed this ambush before field overrides apply.
   * Omit to start from the visitor's already-resolved cohort.
   */
  cohort?: C
  /** Field-level overrides layered on top of the seed cohort copy. */
  copy: Partial<P>
}

/** The fully resolved content for one visitor on one request. */
export interface ResolvedContent<C extends string, P> {
  /** The cohort this visitor resolved into. */
  cohort: C
  /** The default-cohort A/B variant (always reported, for event tagging). */
  abVariant: ABVariant
  /** The final, merged content payload to render. */
  content: P
}

/** Inputs to a single content resolution. All optional except flags. */
export interface ResolveInput<P> {
  /** Flag values keyed by flag name (e.g. the PostHog bootstrap flags). */
  flags: Record<string, string | boolean>
  /** Runtime payloads keyed by flag name (e.g. PostHog flag payloads). */
  payloads?: Record<string, unknown>
  /** Copy to apply when the default cohort is in the A/B `test` variant. */
  abTestContent?: Partial<P> | null
  /** A resolved per-lead ambush override, or null. */
  ambush?: { cohort?: string; copy: Partial<P> } | null
}
