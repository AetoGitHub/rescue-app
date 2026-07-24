import { describe, expect, it } from 'vitest';
import {
  parseRescueBoardViewMode,
  rescueBoardViewQueryValue,
} from '~/utils/rescue-board-view-query';

describe('parseRescueBoardViewMode', () => {
  it('returns the explicit mode from the query value', () => {
    expect(parseRescueBoardViewMode('list')).toBe('list');
    expect(parseRescueBoardViewMode('kanban')).toBe('kanban');
  });

  it('returns null for missing or invalid values', () => {
    expect(parseRescueBoardViewMode(undefined)).toBeNull();
    expect(parseRescueBoardViewMode('grid')).toBeNull();
    expect(parseRescueBoardViewMode('')).toBeNull();
  });
});

describe('rescueBoardViewQueryValue', () => {
  it('keeps the query param explicit for both modes', () => {
    expect(rescueBoardViewQueryValue('kanban')).toBe('kanban');
    expect(rescueBoardViewQueryValue('list')).toBe('list');
  });
});
