import { ComponentType } from 'react';

interface MapViewProps {
  pickup: [number, number] | null;
  destination: [number, number] | null;
}

declare const MapView: ComponentType<MapViewProps>;

export default MapView;
