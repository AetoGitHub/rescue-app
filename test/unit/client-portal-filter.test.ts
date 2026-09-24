import { describe, expect, it } from 'vitest';
import {
  clientPortalClientsQuery,
  groupClientPortalClients,
  mapClientPortalDropdownRows,
} from '../../app/utils/client-portal-filter';
import { isClientApiAllowed } from '../../shared/utils/client-access';

const rows = [
  { id: 12, name: 'TRANSPORTES X', company_id: 3, company_name: 'GRUPO Y' },
  { id: 5, name: 'Acarreos Béta', company_id: 3, company_name: 'GRUPO Y' },
  { id: 7, name: 'Logística Z', company_id: 1, company_name: 'ALFA' },
  { id: 9, name: 'Suelto', company_id: null, company_name: null },
  // Repetido en el corte de página del cursor.
  { id: 12, name: 'TRANSPORTES X', company_id: 3, company_name: 'GRUPO Y' },
];

describe('client portal client filter', () => {
  it('dedupes rows by id', () => {
    expect(mapClientPortalDropdownRows(rows).map(row => row.id)).toEqual([12, 5, 7, 9]);
  });

  it('groups by company alphabetically with "Sin compañía" last', () => {
    const groups = groupClientPortalClients(mapClientPortalDropdownRows(rows));
    expect(groups.map(group => group.companyName)).toEqual([
      'ALFA',
      'GRUPO Y',
      'Sin compañía',
    ]);
    expect(groups[1]!.clients.map(client => client.name)).toEqual([
      'Acarreos Béta',
      'TRANSPORTES X',
    ]);
  });

  it('searches in memory by client or company, ignoring accents', () => {
    const options = mapClientPortalDropdownRows(rows);
    expect(
      groupClientPortalClients(options, 'beta').flatMap(g => g.clients.map(c => c.id)),
    ).toEqual([5]);
    expect(
      groupClientPortalClients(options, 'grupo').flatMap(g => g.clients.map(c => c.id)),
    ).toEqual([5, 12]);
    expect(groupClientPortalClients(options, 'nada')).toEqual([]);
  });

  it('serializes ?clients= as sorted csv ids, omitted when empty', () => {
    expect(clientPortalClientsQuery([4, 1, 3, 1])).toBe('1,3,4');
    expect(clientPortalClientsQuery([])).toBeUndefined();
  });

  it('lets the client call the new dropdown', () => {
    expect(isClientApiAllowed('/api/client/dropdown/?cursor=cD1BQ01F')).toBe(true);
  });
});
