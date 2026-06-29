# portfolio-os

A config-driven, framework-agnostic engine for the **5-level living landing page**: a page that watches its visitors, tests itself, auto-iterates its own copy, and personalizes per audience cohort, down to a single named lead.

The whole engine is driven by one declarative config object. There are no runtime dependencies, no secrets, and no vendor lock-in. Analytics and feature-flag providers are injected as adapters. Swap the config and the same engine powers a different site.

## The 5-level living landing page

Each level adds one capability on top of the one below it. You can stop at any level.

1. **Static** — the page renders the safe coded copy for the default cohort. No analytics, no flags. This is your floor and it always works.
2. **Watch** — the page captures interest signals (`captureAudienceSignal`) so you can measure which audiences show up and what they click.
3. **Test** — an A/B variant of the headline runs on the default cohort, gated by a feature flag. The control is always the static copy, so a missing flag degrades to level 1.
4. **Auto-iterate** — a runtime payload on the personalize flag overrides individual copy fields. A nightly job (or you, in your flag-provider UI) tunes copy with no redeploy. Field overrides are whitelisted, so a bad payload can never inject unexpected keys.
5. **Personalize** — returning visitors are sorted into a cohort from their past signals, and the page re-renders around what that cohort cares about. The most specific layer is **ambush mode**: a hand-written hero for one named lead, addressed by a `?from=<slug>` outreach link.

Resolution precedence, lowest to highest: coded cohort default → headline A/B test (default cohort only) → personalize flag payload → ambush override.

## Install

```bash
npm install portfolio-os
```

No runtime dependencies. TypeScript types are bundled. Requires Node 18+ (or any modern bundler).

## Minimal usage

```ts
import { defineConfig, resolveContent } from 'portfolio-os'

interface HeroCopy {
  headline: string
  cta: string
}

const config = defineConfig<'default' | 'client', HeroCopy>({
  cohorts: ['default', 'client'],
  defaultCohort: 'default',
  flags: { personalize: 'lp-personalize', headline: 'hero-headline' },
  signalEvent: 'audience_signal',
  payloadKeys: ['headline', 'cta'],
  personas: {
    default: { headline: 'I build software.', cta: 'Hire Me' },
    client: { headline: 'I cut your costs with automation.', cta: 'Book a Call' },
  },
})

// Per request: feed in whatever your flag provider returned.
const { cohort, abVariant, content } = resolveContent(config, {
  flags: { 'lp-personalize': 'client', 'hero-headline': 'control' },
  payloads: { 'lp-personalize': { headline: 'I cut your ops costs in half.' } },
})

// content.headline === 'I cut your ops costs in half.'  (payload won)
```

See [`examples/`](./examples) for a complete four-cohort config (Shaurya's portfolio, as a worked example) plus an end-to-end `usage.ts`.

### Optional PostHog adapter

```ts
import { resolveContent } from 'portfolio-os'
import { readPostHogInput, posthogAnalytics } from 'portfolio-os/posthog'

const input = readPostHogInput(config, posthog) // reads the two configured flags + payload
const resolved = resolveContent(config, { ...input, abTestContent, ambush })
```

The adapter is typed against a structural subset of `posthog-js`, so this package never imports or bundles PostHog. Configure PostHog itself (keys, host) from your own environment variables.

## Config reference

`PortfolioOSConfig<C, P>` is generic over the cohort union `C` and the per-cohort payload `P`.

| field | type | meaning |
| --- | --- | --- |
| `cohorts` | `readonly C[]` | every cohort a visitor can resolve into, including the default. |
| `defaultCohort` | `C` | the first-time / unknown-visitor cohort. The A/B test lives here. |
| `personas` | `Record<C, P>` | safe coded copy per cohort, rendered before any runtime payload. |
| `flags.personalize` | `string` | flag carrying the resolved cohort; its payload can override copy. |
| `flags.headline` | `string` | flag carrying the default-cohort A/B variant (`'test'` enables it). |
| `signalEvent` | `string` | event name fired by `captureAudienceSignal`. |
| `payloadKeys` | `readonly (keyof P)[]` | **whitelist** of fields a payload / ambush may override. |
| `validators` | `Partial<Record<keyof P, (v) => boolean>>` | optional per-field value check; a field is only overridden when its validator passes. |
| `tagRouting` | `{ rules: { pattern, cohort }[]; fallback }` | optional: first matching tag pattern wins, else fallback. |
| `channelRouting` | `Record<string, C \| null>` | optional: map a channel (`github`, `linkedin`) to a cohort, or `null` for no intent. |

### Functions

- `resolveContent(config, input)` — resolve the final `{ cohort, abVariant, content }` for one request.
- `cohortFromFlag(config, value)` — narrow an arbitrary flag value to a known cohort, or the default.
- `resolveCohortByTags(config, tags)` — cohort implied by a clicked item's tags.
- `resolveCohortByChannel(config, channel)` — cohort implied by a contact / social channel.
- `resolveAmbush(registry, slug, pattern?)` — resolve a per-lead override. Slugs are **whitelisted** against `^[a-z0-9-]{1,64}$` by default; a slug that fails is treated as no slug (returns `null`).
- `captureAudienceSignal(adapter, config, cohort, context, meta?)` — fire the signal event and set the `audience` person-property via an injected adapter. Safe to call with a `null` adapter.
- `defineConfig(config)` — identity helper that preserves inferred generics.
- `validateConfig(config)` — returns an array of error strings (empty means sound). Run once at startup.

## Design notes

- **No secrets, ever.** Provider keys (e.g. `NEXT_PUBLIC_POSTHOG_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) belong in your environment and your app's adapters, never in this package or your committed config.
- **Whitelist over sanitize.** Both the payload merge (`payloadKeys` + `validators`) and the ambush slug check allow only known-good values rather than stripping bad ones.
- **Fail safe.** Every layer above the static default is optional; a missing or malformed flag, payload, or slug degrades to the level below it. The engine never throws on input.

## License

MIT, Shaurya Vardhan Shandilya. See [LICENSE](./LICENSE).
