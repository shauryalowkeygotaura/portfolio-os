/**
 * EXAMPLE config: the cohorts behind Shaurya Vardhan Shandilya's portfolio.
 *
 * This is shipped purely as a worked example of a `PortfolioOSConfig`. It is
 * NOT the engine's behaviour and you should replace every string here with your
 * own. The engine in ../src reads everything from a config object like this.
 *
 * In your own project import from the published package:
 *     import { defineConfig } from 'portfolio-os'
 * This file imports from the source so the repo type-checks in one pass.
 */
import { defineConfig } from '../src/index.js'
import type { AmbushEntry } from '../src/index.js'

/** The four audiences this example sorts visitors into. */
export type Cohort = 'default' | 'client' | 'recruiter' | 'engineer'

/** The per-cohort content payload this example renders in its hero. */
export interface HeroCopy {
  eyebrow: string
  headline: string
  tagline: string
  cta: string
  ctaTarget: 'contact' | 'projects'
}

export const portfolioConfig = defineConfig<Cohort, HeroCopy>({
  cohorts: ['default', 'client', 'recruiter', 'engineer'],
  defaultCohort: 'default',
  flags: {
    personalize: 'lp-personalize',
    headline: 'hero-headline',
  },
  signalEvent: 'audience_signal',
  // Only these fields may be overridden by a runtime payload or ambush.
  payloadKeys: ['eyebrow', 'headline', 'tagline', 'cta', 'ctaTarget'],
  validators: {
    // ctaTarget is the only field with a constrained value set: whitelist it.
    ctaTarget: (value) => value === 'contact' || value === 'projects',
  },
  // Open-source / upstream tags signal an engineer; everything else a client.
  tagRouting: {
    rules: [{ pattern: /open source|pytorch|aspire|next\.?js/i, cohort: 'engineer' }],
    fallback: 'client',
  },
  channelRouting: {
    linkedin: 'recruiter',
    github: 'engineer',
    email: 'client',
  },
  personas: {
    // First-time / unknown visitor. The headline A/B test owns this cohort.
    default: {
      eyebrow: 'Available for work · India',
      headline: 'I build AI systems that replace human labour.',
      tagline: 'I automate the work businesses hate paying humans to do.',
      cta: 'Hire Me',
      ctaTarget: 'contact',
    },
    // Prospective buyer: lead with money and proof, not craft.
    client: {
      eyebrow: 'Taking on new clients · India',
      headline: 'I cut your operating costs with AI agents.',
      tagline: 'Voice agents and automations that do the work you hate paying humans to do.',
      cta: 'Book a Call',
      ctaTarget: 'contact',
    },
    // Recruiter / admissions: lead with credibility and trajectory.
    recruiter: {
      eyebrow: 'Open to internships & research · India',
      headline: 'A 15-year-old shipping production AI, not demos.',
      tagline: 'Research intern with open PRs in PyTorch and Microsoft Aspire.',
      cta: "See What I've Shipped",
      ctaTarget: 'projects',
    },
    // Fellow engineer: lead with technical depth and code.
    engineer: {
      eyebrow: 'Building in the open · India',
      headline: 'Open-source voice AI that runs at $0.00 a minute.',
      tagline: 'Single-file Python cores, Groq brains, and upstream fixes in massive codebases.',
      cta: 'Read the Code',
      ctaTarget: 'projects',
    },
  },
})

/**
 * Ambush registry: one hand-written hero per named outreach lead. The slug is
 * the `?from=<slug>` an outreach link carries. Keep this small and deliberate.
 */
export const ambushRegistry: Record<string, AmbushEntry<Cohort, HeroCopy>> = {
  'smile-dental-jaipur': {
    cohort: 'client',
    copy: {
      eyebrow: 'Built for Smile Dental Studio · India',
      headline: 'Smile Dental, here is your front desk that never sleeps.',
      tagline: 'An AI receptionist that books, reschedules, and answers every call.',
      cta: 'Book a Call',
      ctaTarget: 'contact',
    },
  },
}
