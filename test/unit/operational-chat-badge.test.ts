import { describe, expect, it } from 'vitest';
import type { RescueGeneralSettings } from '~/interfaces/rescue/settings';
import { getOperationalChatBadgeState } from '~/utils/operational-sla-card';

const NOW = Date.parse('2026-07-24T15:00:00.000Z');

function minutesAgo(minutes: number): string {
  return new Date(NOW - minutes * 60_000).toISOString();
}

function settingsWithChatThresholds(
  yellowMinutes: number,
  redMinutes: number,
): RescueGeneralSettings {
  return {
    sla: {
      time_per_stage: [],
      level_alerts: [],
      update_chat: [
        {
          id: 1,
          service_type: 'rescue',
          operative_status: 'in_progress',
          yellow_time: yellowMinutes,
          yellow_unit: 'minutes',
          red_time: redMinutes,
          red_unit: 'minutes',
        },
      ],
    },
  };
}

describe('getOperationalChatBadgeState', () => {
  it('stays neutral for closed status even without chat messages', () => {
    const badge = getOperationalChatBadgeState(
      {
        last_comment_at: null,
        phase_started_at: minutesAgo(120),
        service_type: 'rescue',
        operative_status: 'closed',
      },
      settingsWithChatThresholds(30, 60),
      NOW,
    );

    expect(badge.color).toBe('neutral');
    expect(badge.label).toBe('Chat —');
  });

  it('uses phase_started_at and returns success before yellow when there is no chat', () => {
    const badge = getOperationalChatBadgeState(
      {
        last_comment_at: null,
        phase_started_at: minutesAgo(10),
        service_type: 'rescue',
        operative_status: 'in_progress',
      },
      settingsWithChatThresholds(30, 60),
      NOW,
    );

    expect(badge.label).toBe('Sin chat');
    expect(badge.color).toBe('success');
  });

  it('uses phase_started_at and returns warning past yellow when there is no chat', () => {
    const badge = getOperationalChatBadgeState(
      {
        last_comment_at: null,
        phase_started_at: minutesAgo(45),
        service_type: 'rescue',
        operative_status: 'in_progress',
      },
      settingsWithChatThresholds(30, 60),
      NOW,
    );

    expect(badge.label).toBe('Sin chat');
    expect(badge.color).toBe('warning');
  });

  it('uses phase_started_at and returns error past red when there is no chat', () => {
    const badge = getOperationalChatBadgeState(
      {
        last_comment_at: null,
        phase_started_at: minutesAgo(90),
        service_type: 'rescue',
        operative_status: 'in_progress',
      },
      settingsWithChatThresholds(30, 60),
      NOW,
    );

    expect(badge.label).toBe('Sin chat');
    expect(badge.color).toBe('error');
  });

  it('stays neutral without chat when no thresholds are configured', () => {
    const badge = getOperationalChatBadgeState(
      {
        last_comment_at: null,
        phase_started_at: minutesAgo(90),
        service_type: 'rescue',
        operative_status: 'in_progress',
      },
      { sla: { time_per_stage: [], update_chat: [], level_alerts: [] } },
      NOW,
    );

    expect(badge.label).toBe('Sin chat');
    expect(badge.color).toBe('neutral');
  });
});
