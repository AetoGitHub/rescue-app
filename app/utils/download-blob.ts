/**
 * Dispara la descarga de un `Blob` de forma compatible con Safari/WebKit.
 *
 * Safari exige que el ancla esté en el DOM para honrar el atributo `download`
 * y revoca el object URL de forma asíncrona, por lo que revocar de inmediato
 * provoca `WebKitBlobResource error 1`. Por eso se difiere el `revokeObjectURL`.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
