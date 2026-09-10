/**
 * Per-rescue status history sent by the API: a list of `{status, entered_at}`
 * entries, one per time the rescue entered that status — a status can be
 * re-entered (e.g. closed → canceled → closed again), so it's a list, not a
 * status-keyed map.
 */
export interface RescueTimelineEntry {
  status: string;
  entered_at: string;
}

export type RescueTimeline = RescueTimelineEntry[];

/** Most recent `entered_at` recorded for `status`, or null if absent/invalid. */
export function getTimelineStatusDate(
  timeline: RescueTimeline | null | undefined,
  status: string | null | undefined,
): string | null {
  if (!timeline || !status) return null;

  let latest: string | null = null;
  let latestTime = -Infinity;

  for (const entry of timeline) {
    if (!entry || entry.status !== status || !entry.entered_at) continue;
    const time = new Date(entry.entered_at).getTime();
    if (Number.isFinite(time) && time > latestTime) {
      latestTime = time;
      latest = entry.entered_at;
    }
  }

  return latest;
}

export function readRescueTimeline(raw: unknown): RescueTimeline | null {
  if (!Array.isArray(raw)) return null;

  return raw.filter((item): item is RescueTimelineEntry =>
    item != null
    && typeof item === 'object'
    && typeof (item as Record<string, unknown>).status === 'string'
    && typeof (item as Record<string, unknown>).entered_at === 'string');
}

/** e.g. "05/01/26, 12:00 p.m." — for the small status-date line on cards. */
export function formatRescueTimelineDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}
