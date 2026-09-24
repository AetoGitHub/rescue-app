import { describe, expect, it } from 'vitest';
import {
  buildAllowedClientsQuery,
  hasAllowedClientsFilters,
  mergeAllowedClientIds,
  parseAllowedClients,
  removeAllowedClientIds,
} from '../../app/utils/allowed-clients';
import { userCreateToCreateBody } from '../../app/schemas/user-create';

describe('allowed clients selection', () => {
  it('"Seleccionar todo" suma sin reemplazar ni duplicar', () => {
    const companyA = mergeAllowedClientIds([], [5, 8]);
    expect(mergeAllowedClientIds(companyA, [8, 9, 14])).toEqual([5, 8, 9, 14]);
  });

  it('"Quitar todo" con filtro quita solo los ids del filtro', () => {
    expect(removeAllowedClientIds([5, 8, 9, 14], [8, 14])).toEqual([5, 9]);
  });

  it('detecta filtros activos e ignora búsqueda vacía', () => {
    expect(hasAllowedClientsFilters({ company: null, name: '  ' })).toBe(false);
    expect(hasAllowedClientsFilters({ company: 3, name: '' })).toBe(true);
    expect(hasAllowedClientsFilters({ company: null, name: 'acme' })).toBe(true);
  });

  it('arma la query con company numérica y omite vacíos', () => {
    expect(buildAllowedClientsQuery({ company: null, name: ' ' })).toEqual({});
    expect(buildAllowedClientsQuery({ company: 3, name: ' acme ' })).toEqual({
      company: '3',
      name: 'acme',
    });
  });

  it('parsea allowed_clients del detalle y del update', () => {
    expect(parseAllowedClients([{ id: 5, name: 'ACME NORTE' }])).toEqual([
      { id: 5, name: 'ACME NORTE' },
    ]);
    expect(parseAllowedClients([5, 8])).toEqual([
      { id: 5, name: '' },
      { id: 8, name: '' },
    ]);
    expect(parseAllowedClients(null)).toEqual([]);
  });

  it('no manda clientes si el rol no es client', () => {
    const base = {
      username: 'JPEREZ',
      first_name: '',
      last_name: '',
      email: 'j@acme.mx',
      phone: '',
      commission: '0',
      password: '12345678',
      is_active: true,
      allowed_clients: [5, 8],
    };
    expect(
      userCreateToCreateBody({ ...base, role: 'seller' }).allowed_clients,
    ).toEqual([]);
    expect(
      userCreateToCreateBody({ ...base, role: 'client' }).allowed_clients,
    ).toEqual([5, 8]);
  });
});
