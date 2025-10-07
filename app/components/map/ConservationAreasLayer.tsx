'use client';
import { useEffect, useMemo, useRef } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import type { FeatureCollection } from 'geojson';

type Props = {
  data: FeatureCollection | null;
};

export default function ConservationAreasLayer({ data }: Props) {
  const map = useMap();
  const layerRef = useRef<L.GeoJSON>(null);

  const style = useMemo(
    () => ({
      fillColor: '#0080ff',
      fillOpacity: 0.15,
      color: '#0047ab',
      weight: 1
    }),
    []
  );

  useEffect(() => {
    if (!map || !data || !layerRef.current) return;
    // Optionally fit bounds when loaded
    // const b = layerRef.current.getBounds();
    // if (b.isValid()) map.fitBounds(b, { padding: [20, 20] });
  }, [data, map]);

  if (!data) return null;

  return (
    <GeoJSON
      ref={layerRef as any}
      data={data}
      style={() => style}
      onEachFeature={(feature, layer) => {
        const p: any = feature.properties || {};
        const lines = [
          `<strong>${p.name ?? 'Conservation Area'}</strong>`,
          p.designated_date ? `Designated: ${p.designated_date}` : '',
          p.lpa_code ? `LPA: ${p.lpa_code}` : '',
          p.article4 ? `Article 4: Yes` : ''
        ].filter(Boolean);
        layer.bindPopup(lines.join('<br/>'));
      }}
    />
  );
}


