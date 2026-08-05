/**
 * Whether a file matches an HTML `accept` attribute value
 * (MIME types, wildcards like `image/*`, and extensions like `.pdf`).
 */
export function fileMatchesAccept(
  file: File,
  accept?: string | null,
): boolean {
  if (accept == null) return true;

  const normalized = accept.trim();
  if (!normalized || normalized === '*') return true;

  const tokens = normalized
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

  if (tokens.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith('.')) {
      return fileName.endsWith(token);
    }
    if (token.endsWith('/*')) {
      const prefix = token.slice(0, -1);
      return mime.startsWith(prefix);
    }
    return mime === token;
  });
}
