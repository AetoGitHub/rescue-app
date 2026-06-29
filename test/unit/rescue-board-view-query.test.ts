import { describe, expect, it } from 'vitest';
import {
  parseRescueBoardViewMode,
  rescueBoardViewQueryValue,
} from '~/utils/rescue-board-view-query';

describe('parseRescueBoardViewMode', () => {
  it('returns list only for the list query value', () => {
    expect(parseRescueBoardViewMode('list')).toBe('list');
  });

  it('defaults to kanban for missing or invalid values', () => {
    expect(parseRescueBoardViewMode(undefined)).toBe('kanban');
    expect(parseRescueBoardViewMode('kanban')).toBe('kanban');
    expect(parseRescueBoardViewMode('grid')).toBe('kanban');
  });
});

describe('rescueBoardViewQueryValue', () => {
  it('omits query param for kanban', () => {
    expect(rescueBoardViewQueryValue('kanban')).toBeUndefined();
  });

  it('uses list for list mode', () => {
    expect(rescueBoardViewQueryValue('list')).toBe('list');
  });
});
