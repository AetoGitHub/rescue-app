import { describe, expect, it } from 'vitest';
import {
  catalogDropdownSelection,
  emptyCatalogDropdownSelection,
} from '~/interfaces/shared/catalog-dropdown.interface';

describe('catalog dropdown selection', () => {
  it('emptyCatalogDropdownSelection returns null value and empty label', () => {
    expect(emptyCatalogDropdownSelection()).toEqual({ value: null, label: '' });
  });

  it('catalogDropdownSelection normalizes nullish value and trims label', () => {
    expect(catalogDropdownSelection(undefined, '  Grúa  ')).toEqual({
      value: null,
      label: 'Grúa',
    });
    expect(catalogDropdownSelection(7, 'Servicio')).toEqual({
      value: 7,
      label: 'Servicio',
    });
  });
});
