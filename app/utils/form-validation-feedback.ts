import { nextTick } from 'vue';

export type FormValidationError = {
  id?: string | number;
  name?: string;
  message?: string;
};

export type FormValidationErrorEvent = {
  errors?: FormValidationError[];
};

export type FormErrorDocument = Pick<Document, 'getElementById' | 'querySelector'>;

export type ReportFormValidationErrorsOptions = {
  toast?: {
    add: (toast: {
      title: string;
      description: string;
      color: 'error';
    }) => void;
  };
  beforeFocus?: (first: FormValidationError) => void | Promise<void>;
  onErrors?: (errors: FormValidationError[]) => void;
  document?: FormErrorDocument;
};

export function listFormValidationErrors(
  event: FormValidationErrorEvent | null | undefined,
): FormValidationError[] {
  return (event?.errors ?? []).filter(
    (error) =>
      Boolean(error.message?.trim())
      || error.name != null
      || error.id != null,
  );
}

export function buildFormValidationToast(errors: FormValidationError[]): {
  title: string;
  description: string;
} {
  const count = errors.length;
  const first = errors[0]?.message?.trim() || 'Completa los campos requeridos.';

  return {
    title: count === 1 ? 'Hay 1 error' : `Hay ${count} errores`,
    description: first,
  };
}

export function resolveFormErrorElement(
  error: FormValidationError,
  root: FormErrorDocument,
): HTMLElement | null {
  if (error.id != null) {
    const byId = root.getElementById(String(error.id));
    if (byId) return byId;
  }

  const name = error.name?.trim();
  if (!name) return null;

  const escaped = typeof CSS !== 'undefined' && CSS.escape
    ? CSS.escape(name)
    : name.replaceAll(/["\\]/g, '\\$&');

  return root.querySelector(`[name="${escaped}"]`);
}

export async function focusFormErrorField(
  error: FormValidationError | undefined,
  root?: FormErrorDocument,
): Promise<void> {
  if (!error || import.meta.server) return;

  await nextTick();

  const doc = root ?? (typeof document === 'undefined' ? null : document);
  if (!doc) return;

  const el = resolveFormErrorElement(error, doc);
  if (!el) return;

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}

export async function reportFormValidationErrors(
  event: FormValidationErrorEvent | null | undefined,
  options: ReportFormValidationErrorsOptions = {},
): Promise<FormValidationError[]> {
  const errors = listFormValidationErrors(event);
  options.onErrors?.(errors);

  if (errors.length === 0) return errors;

  const toastContent = buildFormValidationToast(errors);
  options.toast?.add({
    title: toastContent.title,
    description: toastContent.description,
    color: 'error',
  });

  const first = errors[0];
  if (first) {
    await options.beforeFocus?.(first);
    await focusFormErrorField(first, options.document);
  }

  return errors;
}
