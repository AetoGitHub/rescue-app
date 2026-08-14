import { describe, expect, it, vi } from 'vitest';
import {
  buildFormValidationToast,
  listFormValidationErrors,
  reportFormValidationErrors,
  resolveFormErrorElement,
} from '~/utils/form-validation-feedback';

describe('listFormValidationErrors', () => {
  it('returns an empty list when the event has no errors', () => {
    expect(listFormValidationErrors(undefined)).toEqual([]);
    expect(listFormValidationErrors({ errors: [] })).toEqual([]);
  });

  it('keeps errors that have a message, name, or id', () => {
    expect(
      listFormValidationErrors({
        errors: [
          { message: 'El RFC es obligatorio' },
          { name: 'email' },
          { id: 'field-1' },
          {},
        ],
      }),
    ).toEqual([
      { message: 'El RFC es obligatorio' },
      { name: 'email' },
      { id: 'field-1' },
    ]);
  });
});

describe('buildFormValidationToast', () => {
  it('uses a singular title for one error', () => {
    expect(
      buildFormValidationToast([{ message: 'El RFC es obligatorio' }]),
    ).toEqual({
      title: 'Hay 1 error',
      description: 'El RFC es obligatorio',
    });
  });

  it('uses a plural title and the first message', () => {
    expect(
      buildFormValidationToast([
        { message: 'Introduce un correo válido' },
        { message: 'El teléfono es obligatorio' },
      ]),
    ).toEqual({
      title: 'Hay 2 errores',
      description: 'Introduce un correo válido',
    });
  });

  it('falls back when the first error has no message', () => {
    expect(buildFormValidationToast([{ name: 'rfc' }])).toEqual({
      title: 'Hay 1 error',
      description: 'Completa los campos requeridos.',
    });
  });
});

describe('resolveFormErrorElement', () => {
  it('prefers the element id and falls back to name', () => {
    const byId = { id: 'rfc-input' } as HTMLElement;
    const byName = { id: 'named' } as HTMLElement;
    const root = {
      getElementById: vi.fn((id: string) => (id === 'rfc-input' ? byId : null)),
      querySelector: vi.fn((selector: string) =>
        selector.includes('rfc') ? byName : null,
      ),
    };

    expect(resolveFormErrorElement({ id: 'rfc-input', name: 'rfc' }, root)).toBe(
      byId,
    );
    expect(resolveFormErrorElement({ name: 'rfc' }, root)).toBe(byName);
    expect(resolveFormErrorElement({}, root)).toBeNull();
  });
});

describe('reportFormValidationErrors', () => {
  it('toasts the summary and reports the error list', async () => {
    const add = vi.fn();
    const onErrors = vi.fn();
    const errors = await reportFormValidationErrors(
      {
        errors: [
          { message: 'El RFC es obligatorio', name: 'rfc' },
          { message: 'Introduce un correo válido', name: 'email' },
        ],
      },
      { toast: { add }, onErrors },
    );

    expect(errors).toHaveLength(2);
    expect(onErrors).toHaveBeenCalledWith(errors);
    expect(add).toHaveBeenCalledWith({
      title: 'Hay 2 errores',
      description: 'El RFC es obligatorio',
      color: 'error',
    });
  });
});
