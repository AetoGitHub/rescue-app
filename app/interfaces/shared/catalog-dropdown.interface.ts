export interface CatalogDropdownRow {
  id: number;
  name: string;
}

/** Single-select catalog dropdown model (id + display name). */
export type CatalogDropdownSelection = {
  value: number | null;
  label: string;
};

export function emptyCatalogDropdownSelection(): CatalogDropdownSelection {
  return { value: null, label: '' };
}

export function catalogDropdownSelection(
  value: number | null | undefined,
  label = '',
): CatalogDropdownSelection {
  return {
    value: value ?? null,
    label: label.trim(),
  };
}
