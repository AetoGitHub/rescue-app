/**
 * Per-rescue status history sent by the API: one entry per status key, whose
 * value is either a single ISO datetime or a list of them (a status can be
 * re-entered, e.g. closed → canceled → closed again).
 */
export type RescueTimeline = Record<string, string | string[] | null | undefined>;

/** Most recent ISO datetime recorded for `status`, or null if absent/invalid. */
export function getTimelineStatusDate(
  timeline: RescueTimeline | null | undefined,
  status: string | null | undefined,
): string | null {
  if (!timeline || !status) return null;

  const value = timeline[status];
  if (value == null) return null;

  const candidates = Array.isArray(value) ? value : [value];
  let latest: string | null = null;
  let latestTime = -Infinity;

  for (const candidate of candidates) {
    if (!candidate) continue;
    const time = new Date(candidate).getTime();
    if (Number.isFinite(time) && time > latestTime) {
      latestTime = time;
      latest = candidate;
    }
  }

  return latest;
}

export function readRescueTimeline(raw: unknown): RescueTimeline | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as RescueTimeline;
}

/** e.g. "05/01/26, 12:00 p.m." — for the small status-date line on cards. */
export function formatRescueTimelineDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}
