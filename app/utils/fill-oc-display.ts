import type { FillOcPendingItem } from '~/interfaces/nexxt-step/fill-oc';

/**
 * El API entrega instantes en UTC (`...Z`). Sin `timeZone` explícito el SSR
 * (servidor en UTC) y el móvil renderizarían horas distintas.
 */
const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City';

const fillOcMoneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fillOcDateFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: MEXICO_CITY_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const fillOcTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  timeZone: MEXICO_CITY_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export function parseFillOcAmount(
  value: string | number | null | undefined,
): number {
  if (value == null) return 0;
  const parsed = Number(String(value).trim().replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatFillOcMoney(
  value: string | number | null | undefined,
): string {
  return fillOcMoneyFormatter.format(parseFillOcAmount(value));
}

function parseFillOcDate(iso: string | null | undefined): Date | null {
  if (!iso?.trim()) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatFillOcDate(iso: string | null | undefined): string {
  const date = parseFillOcDate(iso);
  if (!date) return '—';
  return fillOcDateFormatter.format(date).replace('.', '');
}

export function formatFillOcTime(iso: string | null | undefined): string {
  const date = parseFillOcDate(iso);
  if (!date) return '';
  return fillOcTimeFormatter.format(date);
}

export function formatFillOcDateTime(iso: string | null | undefined): string {
  const date = formatFillOcDate(iso);
  if (date === '—') return date;
  return `${date} · ${formatFillOcTime(iso)}`;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Folio, responsable, unidad, descripción y montos; el buscador es local. */
export function matchesFillOcSearch(
  item: Pick<
    FillOcPendingItem,
    | 'folio'
    | 'responsable'
    | 'vehicle'
    | 'service_description'
    | 'sub_total'
    | 'iva'
    | 'total'
  >,
  term: string,
): boolean {
  const needle = normalizeSearchText(term);
  if (!needle) return true;

  const haystack = normalizeSearchText(
    [
      item.folio,
      item.responsable,
      item.vehicle,
      item.service_description,
      item.sub_total,
      item.iva,
      item.total,
      formatFillOcMoney(item.sub_total),
      formatFillOcMoney(item.iva),
      formatFillOcMoney(item.total),
    ].join(' '),
  );
  return haystack.includes(needle);
}
