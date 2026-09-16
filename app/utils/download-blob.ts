/**
 * Dispara la descarga de un `Blob` de forma compatible con Safari/WebKit.
 *
 * Safari exige que el ancla esté en el DOM para honrar el atributo `download`
 * y revoca el object URL de forma asíncrona, por lo que revocar de inmediato
 * provoca `WebKitBlobResource error 1`. Por eso se difiere el `revokeObjectURL`.
 *
 * Safari tampoco honra `download` en blobs con un tipo MIME que sabe
 * previsualizar (PDF, imágenes): en vez de guardar, abre un panel Quick Look
 * con solo opciones para compartir (AirDrop/Mail/...), sin forma de guardar
 * en disco. Se fuerza `application/octet-stream` para que lo trate como
 * binario desconocido y descargue en vez de previsualizar.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(
    new Blob([blob], { type: 'application/octet-stream' }),
  );
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
 * iPhone/iPod, y iPad solo si no está en modo "Sitio de escritorio".
 *
 * No se usa `maxTouchPoints` para distinguir iPad-modo-escritorio de una Mac
 * real: el trackpad de MacBook también reporta `maxTouchPoints > 0` en
 * Safari (soporte de gestos), lo que daba falso positivo en Mac de escritorio.
 */
function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPod|iPad/.test(navigator.userAgent);
}

/**
 * Fuerza guardar un `Blob` en iOS, donde `downloadBlob` no basta.
 *
 * iOS Safari ignora el atributo `download` en tipos que sabe previsualizar
 * (PDF, imágenes): abre el blob en vez de guardarlo, sin aviso. Ahí se usa
 * la hoja nativa de compartir (trae "Guardar en Archivos"). En cualquier
 * otra plataforma (Windows/Chrome, macOS, Android) `navigator.share` con
 * archivos también existe pero abre un diálogo de compartir en vez de
 * descargar — por eso el fallback normal (`downloadBlob`, que ya funciona
 * bien ahí) se usa siempre fuera de iOS.
 */
export async function shareOrDownloadBlob(
  blob: Blob,
  filename: string,
): Promise<void> {
  if (isIosDevice()) {
    const file = new File([blob], filename, { type: blob.type });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
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
