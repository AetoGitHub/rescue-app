import { describe, expect, it } from 'vitest';
import {
  formatRescueDropdownLabel,
  parseRescueAdminDocInput,
  rescueAdminDocCopySchema,
  rescueAdminDocSchema,
  rescueAdminDocToBody,
} from '~/schemas/rescue-admin-doc';
import { mapRescueDropdownSelectItem } from '~/utils/rescue-dropdown-map';

describe('rescue admin doc', () => {
  it('rescueAdminDocToBody maps folios and extra rescues', () => {
    expect(
      rescueAdminDocToBody({
        remittance_folio: 'REM-2026-001',
        invoice_folio: 'FAC-2026-042',
        extra_rescues: [],
      }),
    ).toEqual({
      remittance_folio: 'REM-2026-001',
      invoice_folio: 'FAC-2026-042',
      extra_rescues: [],
    });

    expect(
      rescueAdminDocToBody({
        remittance_folio: 'REM-1',
        invoice_folio: null,
        extra_rescues: [2, 3],
      }),
    ).toEqual({
      remittance_folio: 'REM-1',
      invoice_folio: null,
      extra_rescues: [2, 3],
    });
  });

  it('accepts only remittance or only invoice', () => {
    expect(
      parseRescueAdminDocInput({
        remittance_folio: 'REM-1',
        invoice_folio: '',
      }).success,
    ).toBe(true);

    expect(
      parseRescueAdminDocInput({
        remittance_folio: '',
        invoice_folio: 'FAC-1',
      }).success,
    ).toBe(true);
  });

  it('rejects when both folios are empty', () => {
    expect(
      parseRescueAdminDocInput({
        remittance_folio: '   ',
        invoice_folio: '',
      }).success,
    ).toBe(false);

    expect(
      rescueAdminDocSchema.safeParse({
        remittance_folio: '',
        invoice_folio: '',
      }).success,
    ).toBe(false);
  });

  it('maps empty strings to null in body', () => {
    const parsed = rescueAdminDocCopySchema.parse({
      remittance_folio: 'REM-1',
      invoice_folio: '',
      extra_rescues: [],
    });
    expect(rescueAdminDocToBody(parsed)).toEqual({
      remittance_folio: 'REM-1',
      invoice_folio: null,
      extra_rescues: [],
    });
  });

  it('formatRescueDropdownLabel joins folio and client', () => {
    expect(
      formatRescueDropdownLabel({
        folio: 'RES-2026-00037',
        client_name: 'CLIENTE CON CREDITO',
      }),
    ).toBe('RES-2026-00037 · CLIENTE CON CREDITO');
  });

  it('mapRescueDropdownSelectItem builds menu row', () => {
    expect(
      mapRescueDropdownSelectItem({
        id: 37,
        folio: 'RES-2026-00037',
        client_name: 'CLIENTE CON CREDITO',
        admin_status: 'unattended',
        operative_status: 'closed',
      }),
    ).toEqual({
      id: 37,
      label: 'RES-2026-00037 · CLIENTE CON CREDITO',
      folio: 'RES-2026-00037',
      client_name: 'CLIENTE CON CREDITO',
    });
  });
});
