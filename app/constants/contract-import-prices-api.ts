export const CONTRACT_IMPORT_PRICES_TEMPLATE_PATH = (contractId: number) =>
  `/api/catalogue/contract/${contractId}/items/template/`;

export const CONTRACT_IMPORT_PRICES_UPLOAD_PATH = (contractId: number) =>
  `/api/catalogue/contract/${contractId}/items/upload/`;

export const CONTRACT_IMPORT_PRICES_LABELS = {
  modalTitle: 'Importar precios',
  modalDescription:
    'Sube un archivo con los precios negociados de este contrato.',
  dropzoneLabel: 'Arrastra el archivo aquí',
  dropzoneDescription: 'Formato .xlsx',
  downloadFormatButton: 'Descargar formato',
  uploadButton: 'Subir',
  cancelButton: 'Cancelar',
  noFileTitle: 'Selecciona un archivo primero',
  downloadErrorTitle: 'No se pudo descargar el formato',
  uploadSuccessTitle: 'Precios importados correctamente',
  uploadErrorTitle: 'No se pudo importar el archivo',
  skippedRowTitle: (count: number) =>
    `${count} fila${count === 1 ? '' : 's'} no se importaron`,
} as const;
