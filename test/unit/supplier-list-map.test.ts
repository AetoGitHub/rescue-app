import { describe, expect, it } from 'vitest';
import { mapSupplierListRow, coordsFromSupplierRow, partitionSuppliersByTrust } from '../../app/utils/supplier-list';
import type { RescueSupplierNearbyRow } from '../../app/interfaces/rescue';

describe('mapSupplierListRow', () => {
  it('maps service_types array to service_type', () => {
    const row = mapSupplierListRow({
      id: 2,
      name: 'REMOLQUES EL MENO',
      service_types: ['cranes', 'mechanics'],
      phone: '81 1020 3176',
      is_trusted: true,
      is_active: true,
      score: 4.5,
      rescues_count: 1,
    });
    expect(row.service_type).toEqual(['cranes', 'mechanics']);
    expect(row.rescues_count).toBe(1);
    expect(row.score).toBe(4.5);
  });

  it('maps legacy service_type string', () => {
    const row = mapSupplierListRow({
      id: 1,
      name: 'Legacy',
      service_type: 'road_assist',
      phone: '',
      is_trusted: false,
      is_active: true,
      score: 0,
      rescues_count: 2,
    });
    expect(row.service_type).toEqual(['road_assist']);
    expect(row.rescues_count).toBe(2);
  });

  it('falls back to other when service_types is empty', () => {
    const row = mapSupplierListRow({
      id: 2,
      name: 'Sin tipos',
      service_types: [],
      phone: '',
      is_trusted: true,
      is_active: true,
      score: 0,
      rescues_count: 0,
    });
    expect(row.service_type).toEqual(['other']);
    expect(row.rescues_count).toBe(0);
  });

  it('defaults is_active to true when omitted', () => {
    const row = mapSupplierListRow({
      id: 3,
      name: 'Activo por defecto',
      service_types: ['cranes'],
    });
    expect(row.is_active).toBe(true);
    expect(row.score).toBe(0);
  });

  it('maps distance_km from distance alias', () => {
    const row = mapSupplierListRow({
      id: 4,
      name: 'Cerca',
      service_types: ['cranes'],
      distance: 12.5,
    });
    expect(row.distance_km).toBe(12.5);
  });

  it('maps latitude and longitude from list payload', () => {
    const row = mapSupplierListRow({
      id: 5,
      name: 'Con coords',
      service_types: ['cranes'],
      latitude: '19.432608',
      longitude: '-99.133209',
    });
    expect(row.latitude).toBe('19.432608');
    expect(row.longitude).toBe('-99.133209');
    expect(coordsFromSupplierRow(row)).toEqual({
      lat: 19.432608,
      lng: -99.133209,
    });
  });

  it('maps lat/lng aliases from list payload', () => {
    const row = mapSupplierListRow({
      id: 6,
      name: 'Alias coords',
      service_types: ['cranes'],
      lat: 20.5,
      lng: -100.2,
    });
    expect(coordsFromSupplierRow(row)).toEqual({ lat: 20.5, lng: -100.2 });
  });
});

describe('partitionSuppliersByTrust', () => {
  it('splits trusted and non-trusted without duplication', () => {
    const list: RescueSupplierNearbyRow[] = [
      {
        id: 1,
        name: 'Trusted',
        phone: '',
        is_trusted: true,
        score: 5,
        rescues_count: 0,
        ranking: 5,
        distance_km: null,
        service_type: ['cranes'],
      },
      {
        id: 2,
        name: 'Other',
        phone: '',
        is_trusted: false,
        score: 4,
        rescues_count: 0,
        ranking: 4,
        distance_km: null,
        service_type: ['mechanics'],
      },
    ];
    const { trusted, others } = partitionSuppliersByTrust(list);
    expect(trusted.map((s) => s.id)).toEqual([1]);
    expect(others.map((s) => s.id)).toEqual([2]);
  });
});
