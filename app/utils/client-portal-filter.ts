import { CLIENT_PORTAL_NO_COMPANY_LABEL } from '~/constants/client-portal-api';
import type {
  ClientPortalClientGroup,
  ClientPortalClientOption,
  ClientPortalDropdownApiRow,
} from '~/interfaces/invoicing/client-portal';

/**
 * Normaliza las filas del dropdown. Quita duplicados por id: el cursor ordena
 * por `name`, así que un nombre repetido en el corte de página puede llegar
 * dos veces.
 */
export function mapClientPortalDropdownRows(
  rows: ClientPortalDropdownApiRow[],
): ClientPortalClientOption[] {
  const seen = new Set<number>();
  const options: ClientPortalClientOption[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    options.push({
      id: row.id,
      name: row.name?.trim() || `Cliente ${row.id}`,
      companyName: row.company_name?.trim() || null,
    });
  }
  return options;
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Agrupa por compañía (orden alfabético, "Sin compañía" al final). Con
 * `search`, filtra en memoria por nombre de cliente o de compañía; si coincide
 * la compañía, se muestran todos sus clientes.
 */
export function groupClientPortalClients(
  options: ClientPortalClientOption[],
  search = '',
): ClientPortalClientGroup[] {
  const term = normalizeSearch(search);
  const groups = new Map<string, ClientPortalClientOption[]>();

  for (const option of options) {
    const companyName = option.companyName ?? CLIENT_PORTAL_NO_COMPANY_LABEL;
    if (
      term
      && !normalizeSearch(option.name).includes(term)
      && !normalizeSearch(companyName).includes(term)
    ) {
      continue;
    }
    const clients = groups.get(companyName) ?? [];
    clients.push(option);
    groups.set(companyName, clients);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === CLIENT_PORTAL_NO_COMPANY_LABEL) return 1;
      if (b === CLIENT_PORTAL_NO_COMPANY_LABEL) return -1;
      return a.localeCompare(b, 'es');
    })
    .map(([companyName, clients]) => ({
      companyName,
      clients: [...clients].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    }));
}

/** `?clients=1,2,3`; sin selección no se manda el parámetro. */
export function clientPortalClientsQuery(ids: number[]): string | undefined {
  if (ids.length === 0) return undefined;
  return [...new Set(ids)].sort((a, b) => a - b).join(',');
}
