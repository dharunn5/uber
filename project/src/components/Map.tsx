import { CSSProperties, useMemo } from 'react';

export type LatLng = { lat: number; lng: number };

interface MapProps {
  center: LatLng;
  zoom?: number;
  markers?: LatLng[];
  className?: string;
  style?: CSSProperties;
}

const containerStyle: CSSProperties = { width: '100%', height: '384px', borderRadius: '0.5rem' };

export function Map({ center, zoom = 13, markers = [], className, style }: MapProps) {
  const mergedStyle = useMemo(() => ({ ...containerStyle, ...style }), [style]);

  return (
    <div className={`bg-gray-200 relative overflow-hidden ${className || ''}`} style={mergedStyle}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-gray-600 px-4">
          <p className="font-semibold mb-1">Map preview unavailable</p>
          <p className="text-sm">Third-party map APIs removed for now.</p>
        </div>
      </div>

      <div className="absolute left-3 top-3 bg-white/90 rounded px-3 py-2 shadow text-xs text-gray-700">
        <div>Center: {center.lat.toFixed(5)}, {center.lng.toFixed(5)}</div>
        <div>Zoom: {zoom}</div>
        {markers.length > 0 && (
          <div>Markers: {markers.length}</div>
        )}
      </div>
    </div>
  );
}

export default Map;
