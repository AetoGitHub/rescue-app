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

/**
 * Fuerza guardar un `Blob` en dispositivos donde `downloadBlob` no basta.
 *
 * iOS Safari ignora el atributo `download` en tipos que sabe previsualizar
 * (PDF, imágenes): abre el blob en vez de guardarlo, sin aviso. Cuando el
 * dispositivo soporta compartir archivos (`navigator.canShare`), se usa la
 * hoja nativa de compartir — trae "Guardar en Archivos" — y solo se cae a
 * `downloadBlob` si no está disponible o el usuario cancela.
 */
export async function shareOrDownloadBlob(
  blob: Blob,
  filename: string,
): Promise<void> {
  const file = new File([blob], filename, { type: blob.type });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
    }
  }

  downloadBlob(blob, filename);
}

/**
 * Extrae el nombre de archivo de un header `Content-Disposition`, soportando
 * tanto `filename="..."` como el formato codificado `filename*=UTF-8''...`.
 */
export function filenameFromContentDisposition(
  header: string | null | undefined,
): string | null {
  if (!header) return null;

  const encodedMatch = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // Ignorar y probar con el formato simple.
    }
  }

  const simpleMatch = /filename="?([^";]+)"?/i.exec(header);
  return simpleMatch?.[1]?.trim() || null;
}
