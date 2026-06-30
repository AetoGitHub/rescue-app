export const CLIENT_CSF_MAX_BYTES = 10 * 1024 * 1024;

const CSF_EXTENSIONS = new Set(['pdf']);

function fileExtension(name: string): string {
  const parts = name.split('.');
  if (parts.length < 2) return '';
  return (parts.at(-1) ?? '').toLowerCase();
}

export function isClientCsfFileAllowed(file: File): boolean {
  const ext = fileExtension(file.name);
  if (!ext || !CSF_EXTENSIONS.has(ext)) return false;
  return file.size <= CLIENT_CSF_MAX_BYTES;
}

export function clientCsfAcceptAttribute(): string {
  return '.pdf,application/pdf';
}

export function buildClientCsfStoragePath(clientId: number): string {
  return `catalog/clients/${clientId}/csf`;
}
