import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { computed, ref, toValue } from 'vue';
import {
  createFullscreenFileDropHandlers,
  isFullscreenFileDropActive,
  resolveFullscreenDropValue,
} from '~/composables/useFullscreenFileDrop';
import { fileMatchesAccept } from '~/utils/file-accept';

function makeFile(name: string, type: string): File {
  return new File(['content'], name, { type });
}

function makeDragEvent(
  files: File[],
  types: string[] = ['Files'],
): DragEvent {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    ...files,
  } as unknown as FileList;

  const dataTransfer = {
    types,
    files: fileList,
    dropEffect: 'none' as DataTransfer['dropEffect'],
  };

  return {
    dataTransfer: dataTransfer as DataTransfer,
    preventDefault: vi.fn(),
  } as unknown as DragEvent;
}

describe('fileMatchesAccept', () => {
  it('allows any file when accept is empty or *', () => {
    const file = makeFile('a.pdf', 'application/pdf');
    expect(fileMatchesAccept(file)).toBe(true);
    expect(fileMatchesAccept(file, '')).toBe(true);
    expect(fileMatchesAccept(file, '*')).toBe(true);
  });

  it('matches exact MIME types', () => {
    const pdf = makeFile('a.pdf', 'application/pdf');
    expect(fileMatchesAccept(pdf, 'application/pdf')).toBe(true);
    expect(fileMatchesAccept(pdf, 'image/png')).toBe(false);
  });

  it('matches MIME wildcards', () => {
    const png = makeFile('a.png', 'image/png');
    expect(fileMatchesAccept(png, 'image/*')).toBe(true);
    expect(fileMatchesAccept(png, 'video/*')).toBe(false);
  });

  it('matches file extensions', () => {
    const pdf = makeFile('doc.PDF', '');
    expect(fileMatchesAccept(pdf, '.pdf')).toBe(true);
    expect(fileMatchesAccept(pdf, '.png')).toBe(false);
  });

  it('matches comma-separated accept lists', () => {
    const pdf = makeFile('a.pdf', 'application/pdf');
    expect(fileMatchesAccept(pdf, 'image/*,.pdf,application/pdf')).toBe(true);
  });
});

describe('resolveFullscreenDropValue', () => {
  it('returns the first matching file for single mode', () => {
    const files = [
      makeFile('a.txt', 'text/plain'),
      makeFile('b.png', 'image/png'),
    ];
    expect(
      resolveFullscreenDropValue(files, { accept: 'image/*' }),
    ).toEqual(files[1]);
  });

  it('returns all matching files for multiple mode', () => {
    const files = [
      makeFile('a.png', 'image/png'),
      makeFile('b.txt', 'text/plain'),
      makeFile('c.jpg', 'image/jpeg'),
    ];
    expect(
      resolveFullscreenDropValue(files, { multiple: true, accept: 'image/*' }),
    ).toEqual([files[0], files[2]]);
  });

  it('returns null when nothing matches', () => {
    const files = [makeFile('a.txt', 'text/plain')];
    expect(resolveFullscreenDropValue(files, { accept: 'image/*' })).toBeNull();
  });
});

describe('isFullscreenFileDropActive', () => {
  it('respects enabled and disabled flags', () => {
    expect(isFullscreenFileDropActive({})).toBe(true);
    expect(isFullscreenFileDropActive({ enabled: false })).toBe(false);
    expect(isFullscreenFileDropActive({ disabled: true })).toBe(false);
    expect(
      isFullscreenFileDropActive({ enabled: true, disabled: true }),
    ).toBe(false);
  });
});

describe('createFullscreenFileDropHandlers', () => {
  beforeAll(() => {
    vi.stubGlobal('computed', computed);
    vi.stubGlobal('ref', ref);
    vi.stubGlobal('toValue', toValue);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it('writes a single file to the model and calls onFiles', () => {
    const model = ref<File | null>(null);
    const onFiles = vi.fn();
    const handlers = createFullscreenFileDropHandlers({
      model,
      accept: 'image/*',
      onFiles,
    });

    const png = makeFile('shot.png', 'image/png');
    handlers.onDrop(makeDragEvent([png, makeFile('notes.txt', 'text/plain')]));

    expect(model.value).toBe(png);
    expect(onFiles).toHaveBeenCalledWith(png);
    expect(handlers.isDragging.value).toBe(false);
  });

  it('writes multiple files when multiple is enabled', () => {
    const model = ref<File[]>([]);
    const onFiles = vi.fn();
    const handlers = createFullscreenFileDropHandlers({
      model,
      multiple: true,
      accept: 'image/*',
      onFiles,
    });

    const files = [
      makeFile('a.png', 'image/png'),
      makeFile('b.jpg', 'image/jpeg'),
    ];
    handlers.onDrop(makeDragEvent(files));

    expect(model.value).toEqual(files);
    expect(onFiles).toHaveBeenCalledWith(files);
  });

  it('does not assign files when disabled', () => {
    const model = ref<File | null>(null);
    const onFiles = vi.fn();
    const handlers = createFullscreenFileDropHandlers({
      model,
      disabled: true,
      onFiles,
    });

    handlers.onDrop(makeDragEvent([makeFile('a.png', 'image/png')]));

    expect(model.value).toBeNull();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('does not assign files when enabled is false', () => {
    const model = ref<File | null>(null);
    const onFiles = vi.fn();
    const handlers = createFullscreenFileDropHandlers({
      model,
      enabled: false,
      onFiles,
    });

    handlers.onDrop(makeDragEvent([makeFile('a.png', 'image/png')]));

    expect(model.value).toBeNull();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('ignores drag events without files', () => {
    const model = ref<File | null>(null);
    const handlers = createFullscreenFileDropHandlers({ model });

    handlers.onDragEnter(makeDragEvent([], ['text/plain']));
    expect(handlers.isDragging.value).toBe(false);

    handlers.onDrop(makeDragEvent([], ['text/plain']));
    expect(model.value).toBeNull();
  });

  it('tracks dragging with enter/leave depth', () => {
    const model = ref<File | null>(null);
    const handlers = createFullscreenFileDropHandlers({ model });
    const event = makeDragEvent([makeFile('a.png', 'image/png')]);

    handlers.onDragEnter(event);
    handlers.onDragEnter(event);
    expect(handlers.isDragging.value).toBe(true);

    handlers.onDragLeave(event);
    expect(handlers.isDragging.value).toBe(true);

    handlers.onDragLeave(event);
    expect(handlers.isDragging.value).toBe(false);
  });
});
