import { describe, expect, it } from 'vitest';
import { getTimelineStatusDate, readRescueTimeline } from '../../app/utils/rescue-timeline';

describe('getTimelineStatusDate', () => {
  it('returns the date for a status with one entry', () => {
    const timeline = [
      { status: 'pending_authorization', entered_at: '2026-09-08T22:52:09.623287+00:00' },
      { status: 'approved', entered_at: '2026-09-10T19:15:06.962672+00:00' },
    ];
    expect(getTimelineStatusDate(timeline, 'approved')).toBe(
      '2026-09-10T19:15:06.962672+00:00',
    );
  });

  it('returns the most recent date when a status was reached more than once', () => {
    const timeline = [
      { status: 'closed', entered_at: '2026-01-05T12:00:00Z' },
      { status: 'canceled', entered_at: '2026-01-06T09:00:00Z' },
      { status: 'closed', entered_at: '2026-01-08T15:00:00Z' },
    ];
    expect(getTimelineStatusDate(timeline, 'closed')).toBe('2026-01-08T15:00:00Z');
  });

  it('returns null when the status is missing from the timeline', () => {
    const timeline = [{ status: 'closed', entered_at: '2026-01-01T00:00:00Z' }];
    expect(getTimelineStatusDate(timeline, 'canceled')).toBeNull();
  });

  it('returns null for a null/undefined timeline or status', () => {
    expect(getTimelineStatusDate(null, 'closed')).toBeNull();
    expect(
      getTimelineStatusDate([{ status: 'closed', entered_at: '2026-01-01T00:00:00Z' }], null),
    ).toBeNull();
  });

  it('ignores entries with an unparseable entered_at', () => {
    const timeline = [
      { status: 'closed', entered_at: 'not-a-date' },
      { status: 'closed', entered_at: '2026-01-08T15:00:00Z' },
    ];
    expect(getTimelineStatusDate(timeline, 'closed')).toBe('2026-01-08T15:00:00Z');
  });
});

describe('readRescueTimeline', () => {
  it('passes through a valid entry list', () => {
    const raw = [{ status: 'closed', entered_at: '2026-01-01T00:00:00Z' }];
    expect(readRescueTimeline(raw)).toEqual(raw);
  });

  it('drops malformed entries but keeps valid ones', () => {
    const raw = [
      { status: 'closed', entered_at: '2026-01-01T00:00:00Z' },
      { status: 'closed' },
      { entered_at: '2026-01-01T00:00:00Z' },
      null,
      'closed',
    ];
    expect(readRescueTimeline(raw)).toEqual([
      { status: 'closed', entered_at: '2026-01-01T00:00:00Z' },
    ]);
  });

  it('returns null for a plain object, primitives, or nullish input', () => {
    expect(readRescueTimeline({ closed: '2026-01-01T00:00:00Z' })).toBeNull();
    expect(readRescueTimeline('closed')).toBeNull();
    expect(readRescueTimeline(null)).toBeNull();
    expect(readRescueTimeline(undefined)).toBeNull();
  });
});
