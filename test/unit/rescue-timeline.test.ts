import { describe, expect, it } from 'vitest';
import { getTimelineStatusDate, readRescueTimeline } from '../../app/utils/rescue-timeline';

describe('getTimelineStatusDate', () => {
  it('returns the single date for a status with one entry', () => {
    const timeline = { pending_authorization: '2026-01-01T10:00:00Z' };
    expect(getTimelineStatusDate(timeline, 'pending_authorization')).toBe(
      '2026-01-01T10:00:00Z',
    );
  });

  it('returns the most recent date when a status was reached more than once', () => {
    const timeline = {
      closed: ['2026-01-05T12:00:00Z', '2026-01-08T15:00:00Z', '2026-01-02T00:00:00Z'],
    };
    expect(getTimelineStatusDate(timeline, 'closed')).toBe('2026-01-08T15:00:00Z');
  });

  it('returns null when the status is missing from the timeline', () => {
    expect(getTimelineStatusDate({ closed: '2026-01-01T00:00:00Z' }, 'canceled')).toBeNull();
  });

  it('returns null for a null/undefined timeline or status', () => {
    expect(getTimelineStatusDate(null, 'closed')).toBeNull();
    expect(getTimelineStatusDate({ closed: '2026-01-01T00:00:00Z' }, null)).toBeNull();
  });

  it('ignores unparseable entries within an array', () => {
    const timeline = { closed: ['not-a-date', '2026-01-08T15:00:00Z'] };
    expect(getTimelineStatusDate(timeline, 'closed')).toBe('2026-01-08T15:00:00Z');
  });
});

describe('readRescueTimeline', () => {
  it('passes through a plain object', () => {
    const raw = { closed: '2026-01-01T00:00:00Z' };
    expect(readRescueTimeline(raw)).toEqual(raw);
  });

  it('returns null for arrays, primitives, or nullish input', () => {
    expect(readRescueTimeline(['a'])).toBeNull();
    expect(readRescueTimeline('closed')).toBeNull();
    expect(readRescueTimeline(null)).toBeNull();
    expect(readRescueTimeline(undefined)).toBeNull();
  });
});
