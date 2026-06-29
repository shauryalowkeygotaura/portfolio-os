import type { AmbushEntry } from './types.js'

/**
 * Ambush mode: when an outreach link carries a known `?from=<slug>`, the page
 * can be hand-tuned for that one named lead, addressing them by name before
 * they even reply. This is the most specific personalization layer, so it wins
 * over generic cohort copy and any runtime flag payload.
 *
 * Whitelist, never sanitize: a slug that fails the pattern is treated as "no
 * slug" (returns null, falling back to normal cohort copy). Bad characters are
 * never stripped and then trusted.
 */

/** The only accepted slug shape: lowercase alphanumerics and hyphens, 1-64. */
export const DEFAULT_SLUG_PATTERN = /^[a-z0-9-]{1,64}$/

/**
 * Resolve a curated ambush entry for a raw `from` slug.
 *
 * @param registry - map of slug -> hand-written override for that lead.
 * @param slug     - the raw, untrusted slug from the request.
 * @param pattern  - the whitelist a slug must match (defaults to the standard).
 * @returns the curated entry, or null when the slug is missing, fails the
 *          whitelist, or is not present in the registry.
 */
export function resolveAmbush<C extends string, P>(
  registry: Record<string, AmbushEntry<C, P>>,
  slug: string | null | undefined,
  pattern: RegExp = DEFAULT_SLUG_PATTERN
): AmbushEntry<C, P> | null {
  if (!slug || !pattern.test(slug)) return null
  return registry[slug] ?? null
}
