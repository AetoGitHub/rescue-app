export interface SupplierMapPinColors {
  background: string;
  borderColor: string;
  glyphColor: string;
}

export interface MapPinLegendItem {
  color: string;
  borderColor?: string;
  label: string;
}

export const SUPPLIER_MAP_UNIT_PIN: SupplierMapPinColors = {
  background: '#fbbc04',
  borderColor: '#e6a800',
  glyphColor: '#ffffff',
};

export const SUPPLIER_MAP_TRUSTED_PIN: SupplierMapPinColors = {
  background: '#f59e0b',
  borderColor: '#d97706',
  glyphColor: '#ffffff',
};

export const SUPPLIER_MAP_REGULAR_PIN: SupplierMapPinColors = {
  background: '#2563eb',
  borderColor: '#1d4ed8',
  glyphColor: '#ffffff',
};

export const SUPPLIER_MAP_SELECTED_PIN: SupplierMapPinColors = {
  background: '#16a34a',
  borderColor: '#15803d',
  glyphColor: '#ffffff',
};

export const RESCUE_SUPPLIER_MAP_LEGEND: MapPinLegendItem[] = [
  {
    color: SUPPLIER_MAP_UNIT_PIN.background,
    borderColor: SUPPLIER_MAP_UNIT_PIN.borderColor,
    label: 'Ubicación del rescate',
  },
  {
    color: SUPPLIER_MAP_TRUSTED_PIN.background,
    borderColor: SUPPLIER_MAP_TRUSTED_PIN.borderColor,
    label: 'Proveedor de confianza',
  },
  {
    color: SUPPLIER_MAP_REGULAR_PIN.background,
    borderColor: SUPPLIER_MAP_REGULAR_PIN.borderColor,
    label: 'Otros proveedores',
  },
  {
    color: SUPPLIER_MAP_SELECTED_PIN.background,
    borderColor: SUPPLIER_MAP_SELECTED_PIN.borderColor,
    label: 'Proveedor seleccionado',
  },
];

export const CATALOG_SUPPLIER_MAP_LEGEND: MapPinLegendItem[] = [
  {
    color: SUPPLIER_MAP_TRUSTED_PIN.background,
    borderColor: SUPPLIER_MAP_TRUSTED_PIN.borderColor,
    label: 'Proveedor de confianza',
  },
  {
    color: SUPPLIER_MAP_REGULAR_PIN.background,
    borderColor: SUPPLIER_MAP_REGULAR_PIN.borderColor,
    label: 'Otros proveedores',
  },
];

export const RESCUE_DETAIL_ROUTE_MAP_LEGEND: MapPinLegendItem[] = [
  {
    color: SUPPLIER_MAP_UNIT_PIN.background,
    borderColor: SUPPLIER_MAP_UNIT_PIN.borderColor,
    label: 'Ubicación del rescate',
  },
  {
    color: SUPPLIER_MAP_SELECTED_PIN.background,
    borderColor: SUPPLIER_MAP_SELECTED_PIN.borderColor,
    label: 'Proveedor',
  },
];

export function trustedSupplierPinOptions(isTrusted: boolean): SupplierMapPinColors {
  return isTrusted ? SUPPLIER_MAP_TRUSTED_PIN : SUPPLIER_MAP_REGULAR_PIN;
}
