import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearRoutePolylines,
  drawDrivingRoutePolylines,
  requestDrivingRoute,
  type DrivingRoute,
} from '~/utils/maps-directions';

function mockRouteClass(routes: DrivingRoute[] | null) {
  return {
    computeRoutes: vi.fn(async () => ({ routes })),
  };
}

describe('maps-directions helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns the first route from Route.computeRoutes', async () => {
    const route: DrivingRoute = {
      createPolylines: vi.fn(() => []),
    };
    const Route = mockRouteClass([route]);

    vi.stubGlobal('google', {
      maps: {
        importLibrary: vi.fn(),
      },
    });

    await expect(
      requestDrivingRoute(
        { lat: 19.4, lng: -99.1 },
        { lat: 19.5, lng: -99.2 },
        Route,
      ),
    ).resolves.toBe(route);

    expect(Route.computeRoutes).toHaveBeenCalledWith({
      origin: { lat: 19.4, lng: -99.1 },
      destination: { lat: 19.5, lng: -99.2 },
      travelMode: 'DRIVING',
      fields: ['path'],
    });
  });

  it('returns null when computeRoutes yields no routes', async () => {
    const Route = mockRouteClass(null);

    vi.stubGlobal('google', {
      maps: {
        importLibrary: vi.fn(),
      },
    });

    await expect(
      requestDrivingRoute(
        { lat: 19.4, lng: -99.1 },
        { lat: 19.5, lng: -99.2 },
        Route,
      ),
    ).resolves.toBeNull();
  });

  it('returns null when google maps is unavailable', async () => {
    vi.stubGlobal('google', undefined);
    await expect(
      requestDrivingRoute({ lat: 1, lng: 2 }, { lat: 3, lng: 4 }),
    ).resolves.toBeNull();
  });

  it('returns null when computeRoutes throws', async () => {
    const Route = {
      computeRoutes: vi.fn(async () => {
        throw new Error('Routes API disabled');
      }),
    };

    vi.stubGlobal('google', {
      maps: {
        importLibrary: vi.fn(),
      },
    });

    await expect(
      requestDrivingRoute(
        { lat: 19.4, lng: -99.1 },
        { lat: 19.5, lng: -99.2 },
        Route,
      ),
    ).resolves.toBeNull();
  });

  it('drawDrivingRoutePolylines attaches polylines to the map', () => {
    const setMap = vi.fn();
    const setOptions = vi.fn();
    const polyline = { setMap, setOptions } as unknown as google.maps.Polyline;
    const route: DrivingRoute = {
      createPolylines: vi.fn(() => [polyline]),
    };
    const map = {} as google.maps.Map;

    const drawn = drawDrivingRoutePolylines(map, route);
    expect(drawn).toEqual([polyline]);
    expect(setOptions).toHaveBeenCalled();
    expect(setMap).toHaveBeenCalledWith(map);
  });

  it('clearRoutePolylines detaches polylines from the map', () => {
    const setMap = vi.fn();
    clearRoutePolylines([
      { setMap } as unknown as google.maps.Polyline,
    ]);
    expect(setMap).toHaveBeenCalledWith(null);
  });

  it('clearRoutePolylines ignores null', () => {
    expect(() => clearRoutePolylines(null)).not.toThrow();
  });
});
