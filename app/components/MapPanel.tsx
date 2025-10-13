'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { Feature, FeatureCollection } from 'geojson';
import L from 'leaflet';

export interface MapPanelProps {
  boundaryGeoJSON?: Feature | FeatureCollection | null;
}

export default function MapPanel({ boundaryGeoJSON }: MapPanelProps) {
  const [showLpa, setShowLpa] = useState(true);
  const [panelOpen, setPanelOpen] = useState(true);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  const center = useMemo(() => ({ lat: 53.8, lng: -2.5 }), []);

  useEffect(() => {
    if (showLpa && boundaryGeoJSON && geoJsonRef.current) {
      try {
        const bounds = geoJsonRef.current.getBounds();
        const map = geoJsonRef.current._map as L.Map | undefined;
        if (map && bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
          // Prevent zooming out beyond England-level view
          const minZoom = 5;
          if (map.getZoom() < minZoom) map.setZoom(minZoom);
        }
      } catch {
        // ignore
      }
    }
  }, [showLpa, boundaryGeoJSON]);

  const style = useMemo(
    () => ({
      color: '#3b82f6',
      weight: 2,
      opacity: 1,
      fillColor: '#3b82f6',
      fillOpacity: 0.15
    }),
    []
  );

  return (
    <div className="relative">
      {/* Sidebar overlay */}
      {panelOpen ? (
        <div className="absolute right-4 top-4 z-[400] w-64 rounded-md border bg-white p-3 shadow">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium">Data layers</div>
            <button
              className="h-6 w-6 rounded border text-gray-600 hover:bg-gray-50"
              onClick={() => setPanelOpen(false)}
              title="Hide panel"
            >
              ×
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm" title="Shows the Local Planning Authority boundary that contains the searched address.">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-500"></span>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={showLpa}
              onChange={(e) => setShowLpa(e.target.checked)}
            />
            <span>Local planning authority</span>
          </label>
        </div>
      ) : (
        <button
          className="absolute right-4 top-4 z-[400] rounded-md border bg-white px-2 py-1 text-sm shadow"
          onClick={() => setPanelOpen(true)}
        >
          Show layers
        </button>
      )}

      <MapContainer
        center={center}
        zoom={5.5}
        minZoom={5}
        maxBounds={[[49.5, -7.8], [55.9, 2.2]]}
        maxBoundsViscosity={1}
        className="h-[520px] rounded-lg overflow-hidden border"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        {showLpa && boundaryGeoJSON ? (
          <GeoJSON data={boundaryGeoJSON as any} style={style as any} ref={(ref) => (geoJsonRef.current = ref as any)}>
          </GeoJSON>
        ) : null}
      </MapContainer>
    </div>
  );
}

