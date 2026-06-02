import { describe, expect, it } from 'vitest';
import {
  generateInvoiceNumber,
  generateRemittanceNumber,
} from '~/utils/rescue-administrative-doc-numbers';

describe('rescue-administrative-doc-numbers', () => {
  it('generates remittance number with year', () => {
    const value = generateRemittanceNumber(new Date('2026-06-02'));
    expect(value).toMatch(/^REM-2026-\d{5}$/);
  });

  it('generates invoice number prefix', () => {
    const value = generateInvoiceNumber();
    expect(value).toMatch(/^A-\d{6}$/);
  });
});
