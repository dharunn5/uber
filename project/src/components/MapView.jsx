import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FitToBounds({ pickup, destination }) {
  const map = useMap();

  useEffect(() => {
    if (pickup && destination) {
      const bounds = L.latLngBounds([pickup, destination]);
      map.fitBounds(bounds, { padding: [24, 24] });
    } else if (pickup) {
      map.setView(pickup, 13);
    } else if (destination) {
      map.setView(destination, 13);
    }
  }, [map, pickup, destination]);

  return null;
}

export default function MapView({ pickup, destination }) {
  const center = useMemo(() => {
    if (pickup) return pickup;
    if (destination) return destination;
    return [20, 0];
  }, [pickup, destination]);

  const hasPickup = Array.isArray(pickup) && pickup.length === 2;
  const hasDestination = Array.isArray(destination) && destination.length === 2;

  return (
    <div className="w-full" style={{ height: 300 }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitToBounds pickup={hasPickup ? pickup : null} destination={hasDestination ? destination : null} />

        {hasPickup && (
          <Marker position={pickup}>
            <Popup>Pickup</Popup>
          </Marker>
        )}

        {hasDestination && (
          <Marker position={destination}>
            <Popup>Destination</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}


