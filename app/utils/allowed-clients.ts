/** Filtros del selector de clientes asignados; los mismos para dropdown e ids. */
export interface AllowedClientsFilters {
  company: number | null;
  name: string;
}

export function hasAllowedClientsFilters(filters: AllowedClientsFilters): boolean {
  return filters.company != null || filters.name.trim() !== '';
}

/** Query para `/client/dropdown/` y `/client/ids/`; omite filtros vacíos. */
export function buildAllowedClientsQuery(
  filters: AllowedClientsFilters,
): Record<string, string> {
  const query: Record<string, string> = {};
  if (filters.company != null) query.company = String(filters.company);
  const name = filters.name.trim();
  if (name) query.name = name;
  return query;
}

/** "Seleccionar todo": suma a la selección actual sin reemplazarla. */
export function mergeAllowedClientIds(
  selected: readonly number[],
  ids: readonly number[],
): number[] {
  return [...new Set([...selected, ...ids])];
}

/** "Quitar todo" con filtros: quita solo los ids que coinciden con el filtro. */
export function removeAllowedClientIds(
  selected: readonly number[],
  ids: readonly number[],
): number[] {
  const toRemove = new Set(ids);
  return selected.filter((id) => !toRemove.has(id));
}

/** `allowed_clients` del detalle (`[{id, name}]`) o del update (`[ids]`). */
export function parseAllowedClients(
  raw: unknown,
): { id: number; name: string }[] {
  if (!Array.isArray(raw)) return [];
  const rows: { id: number; name: string }[] = [];
  for (const item of raw) {
    if (typeof item === 'number' && Number.isFinite(item)) {
      rows.push({ id: item, name: '' });
      continue;
    }
    if (item && typeof item === 'object') {
      const id = Number((item as Record<string, unknown>).id);
      if (!Number.isFinite(id)) continue;
      rows.push({
        id,
        name: String((item as Record<string, unknown>).name ?? '').trim(),
      });
    }
  }
  return rows;
}
