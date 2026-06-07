export const CLIENT_TYPE_OPTIONS = [
  { label: 'Contado', value: 'CASH' },
  { label: 'Crédito', value: 'CREDIT' },
  { label: 'Público general', value: 'PUBLIC' },
] as const;

export const BILLING_TYPE_VALUES = [
  'DIRECT_INVOICE',
  'MANUAL',
  'REMISSION',
] as const;

export const BILLING_TYPE_OPTIONS = [
  { label: 'Factura directa', value: 'DIRECT_INVOICE' },
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Remisión', value: 'REMISSION' },
] as const satisfies ReadonlyArray<{
  label: string;
  value: (typeof BILLING_TYPE_VALUES)[number];
}>;

export const COMMISSION_TYPE_OPTIONS = [
  { label: 'Porcentaje', value: 'PERCENTAGE' },
  { label: 'Fijo', value: 'FIXED' },
] as const;

export const SERVICE_UNIT_VALUES = [
  'service',
  'hour',
  'piece',
  'km',
  'day',
  'other',
] as const;

export const SERVICE_UNIT_OPTIONS = [
  { label: 'Servicio', value: 'service' },
  { label: 'Hora', value: 'hour' },
  { label: 'Pieza', value: 'piece' },
  { label: 'Km', value: 'km' },
  { label: 'Día', value: 'day' },
  { label: 'Otro', value: 'other' },
] as const;

export const SUPPLIER_SERVICE_TYPE_OPTIONS = [
  { label: 'Grúas', value: 'cranes' },
  { label: 'Mecánica', value: 'mechanics' },
  { label: 'Auxilio Vial', value: 'road_assist' },
  { label: 'Montacargas', value: 'forklifts' },
  { label: 'Plataforma', value: 'flatbed' },
  { label: 'Transporte', value: 'transport' },
  { label: 'Otro', value: 'other' },
] as const;
