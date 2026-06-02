export const MULTIPURPOSE_CATALOGUE_TYPES = [
  'service_category',
  'cancellation_reason',
  'reacceptance_reason',
] as const;

export type MultipurposeCatalogueType =
  (typeof MULTIPURPOSE_CATALOGUE_TYPES)[number];

export const MULTIPURPOSE_CATALOG_LABELS: Record<
  MultipurposeCatalogueType,
  string
> = {
  service_category: 'Categoría de servicio',
  cancellation_reason: 'Motivo de cancelación',
  reacceptance_reason: 'Motivo de re-aceptación',
};
