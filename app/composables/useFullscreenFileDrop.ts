import { fileMatchesAccept } from '~/utils/file-accept';

type SingleFileModel = Ref<File | null>;
type MultipleFileModel = Ref<File[]>;

export interface UseFullscreenFileDropOptions {
  model: SingleFileModel | MultipleFileModel;
  multiple?: boolean;
  accept?: MaybeRefOrGetter<string | undefined>;
  disabled?: MaybeRefOrGetter<boolean>;
  enabled?: MaybeRefOrGetter<boolean>;
  /**
   * Called after the model is assigned. Needed because writing the parent
   * `v-model` ref does not emit `@update:model-value` from `UFileUpload`.
   */
  onFiles?: (value: File | File[] | null) => void;
}

export function isFullscreenFileDropActive(options: {
  enabled?: boolean;
  disabled?: boolean;
}): boolean {
  if (options.enabled === false) return false;
  if (options.disabled === true) return false;
  return true;
}

export function resolveFullscreenDropValue(
  files: File[],
  options: { multiple?: boolean; accept?: string | null } = {},
): File | File[] | null {
  const matched = files.filter((file) =>
    fileMatchesAccept(file, options.accept),
  );
  if (matched.length === 0) return null;
  if (options.multiple) return matched;
  return matched[0] ?? null;
}

function dataTransferHasFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes('Files');
}

export function createFullscreenFileDropHandlers(
  options: UseFullscreenFileDropOptions,
) {
  const isDragging = ref(false);
  let dragDepth = 0;

  const isActive = () =>
    isFullscreenFileDropActive({
      enabled: toValue(options.enabled),
      disabled: toValue(options.disabled),
    });

  function resetDragging() {
    dragDepth = 0;
    isDragging.value = false;
  }

  function assignResolved(resolved: File | File[] | null) {
    if (resolved == null) return;

    if (options.multiple) {
      const next = Array.isArray(resolved) ? resolved : [resolved];
      (options.model as MultipleFileModel).value = next;
      options.onFiles?.(next);
      return;
    }

    const next = Array.isArray(resolved) ? (resolved[0] ?? null) : resolved;
    (options.model as SingleFileModel).value = next;
    options.onFiles?.(next);
  }

  function onDragEnter(event: DragEvent) {
    if (!dataTransferHasFiles(event.dataTransfer) || !isActive()) return;
    event.preventDefault();
    dragDepth += 1;
    isDragging.value = true;
  }

  function onDragOver(event: DragEvent) {
    if (!dataTransferHasFiles(event.dataTransfer) || !isActive()) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  function onDragLeave(event: DragEvent) {
    if (!dataTransferHasFiles(event.dataTransfer) || !isActive()) return;
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) {
      isDragging.value = false;
    }
  }

  function onDrop(event: DragEvent) {
    if (!dataTransferHasFiles(event.dataTransfer) || !isActive()) {
      resetDragging();
      return;
    }
    event.preventDefault();
    resetDragging();
    const resolved = resolveFullscreenDropValue(
      Array.from(event.dataTransfer?.files ?? []),
      {
        multiple: options.multiple,
        accept: toValue(options.accept),
      },
    );
    assignResolved(resolved);
  }

  return {
    isDragging,
    resetDragging,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
    isActive,
  };
}

export function useFullscreenFileDrop(options: UseFullscreenFileDropOptions) {
  const handlers = createFullscreenFileDropHandlers(options);

  function onWindowBlur() {
    handlers.resetDragging();
  }

  if (import.meta.client) {
    onMounted(() => {
      window.addEventListener('dragenter', handlers.onDragEnter);
      window.addEventListener('dragover', handlers.onDragOver);
      window.addEventListener('dragleave', handlers.onDragLeave);
      window.addEventListener('drop', handlers.onDrop);
      window.addEventListener('blur', onWindowBlur);
    });

    onUnmounted(() => {
      window.removeEventListener('dragenter', handlers.onDragEnter);
      window.removeEventListener('dragover', handlers.onDragOver);
      window.removeEventListener('dragleave', handlers.onDragLeave);
      window.removeEventListener('drop', handlers.onDrop);
      window.removeEventListener('blur', onWindowBlur);
      handlers.resetDragging();
    });
  }

  watch(
    () => [toValue(options.enabled), toValue(options.disabled)] as const,
    () => {
      if (!handlers.isActive()) handlers.resetDragging();
    },
  );

  return { isDragging: handlers.isDragging };
}
