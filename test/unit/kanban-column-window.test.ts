import { describe, expect, it } from 'vitest';
import {
  getKanbanActiveColumnIndex,
  isKanbanColumnInMountWindow,
} from '~/utils/kanban-column-window';

describe('isKanbanColumnInMountWindow', () => {
  it('mounts every column when not windowed', () => {
    expect(isKanbanColumnInMountWindow(9, 0)).toBe(true);
    expect(isKanbanColumnInMountWindow(9, 0, { windowed: false })).toBe(true);
  });

  it('keeps the active column and its neighbors on mobile', () => {
    expect(isKanbanColumnInMountWindow(0, 0, { windowed: true })).toBe(true);
    expect(isKanbanColumnInMountWindow(1, 0, { windowed: true })).toBe(true);
    expect(isKanbanColumnInMountWindow(2, 0, { windowed: true })).toBe(false);

    expect(isKanbanColumnInMountWindow(3, 4, { windowed: true })).toBe(true);
    expect(isKanbanColumnInMountWindow(4, 4, { windowed: true })).toBe(true);
    expect(isKanbanColumnInMountWindow(5, 4, { windowed: true })).toBe(true);
    expect(isKanbanColumnInMountWindow(6, 4, { windowed: true })).toBe(false);
  });
});

describe('getKanbanActiveColumnIndex', () => {
  it('returns 0 when there are no children', () => {
    expect(getKanbanActiveColumnIndex(0, [])).toBe(0);
  });

  it('picks the child closest to the container left edge', () => {
    expect(getKanbanActiveColumnIndex(0, [0, 280, 560])).toBe(0);
    expect(getKanbanActiveColumnIndex(270, [0, 280, 560])).toBe(1);
    expect(getKanbanActiveColumnIndex(800, [0, 280, 560])).toBe(2);
  });
});
