// Thin wrappers over the shared @chirag127/oz-ai package. Imported dynamically
// by the island ONLY when the user triggers an AI action — keeps it off the
// initial bundle. All calls degrade gracefully; caller handles thrown errors.
import { complete } from '@chirag127/oz-ai'

const SYS =
  'You are a concise resume editor. Return ONLY the requested text, no preamble, ' +
  'no markdown fences, no commentary. Use strong action verbs, quantify impact, ' +
  'keep ATS-friendly plain wording. One line per bullet.'

/** Rewrite a single bullet stronger. Returns plain text. */
export async function rewriteBullet(bullet: string, signal?: AbortSignal): Promise<string> {
  const out = await complete(
    `Rewrite this resume bullet to be stronger and quantified. Keep it one line:\n\n${bullet}`,
    { system: SYS, signal, temperature: 0.6 },
  )
  return clean(out)
}

/** Tailor a bullet toward a specific job description. */
export async function tailorBullet(
  bullet: string,
  jobDescription: string,
  signal?: AbortSignal,
): Promise<string> {
  const out = await complete(
    `Job description:\n${jobDescription.slice(0, 2000)}\n\n` +
      `Rewrite this resume bullet so it aligns with the job above, ` +
      `weaving in relevant keywords truthfully. One line:\n\n${bullet}`,
    { system: SYS, signal, temperature: 0.6 },
  )
  return clean(out)
}

/** Generate a professional summary from the role + a few bullets. */
export async function draftSummary(
  title: string,
  bullets: string[],
  signal?: AbortSignal,
): Promise<string> {
  const out = await complete(
    `Write a 2-3 sentence professional summary for a "${title}". ` +
      `Base it on these highlights:\n- ${bullets.slice(0, 6).join('\n- ')}\n` +
      `Third person implied, no "I". Quantify where possible.`,
    { system: SYS, signal, temperature: 0.7 },
  )
  return clean(out)
}

function clean(s: string): string {
  return s
    .replace(/^```[a-z]*\n?/i, '')
    .replace(/```$/i, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/^["']|["']$/g, '')
    .trim()
}
