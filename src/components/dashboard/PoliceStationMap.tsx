import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers not showing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const policeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface PoliceStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  distance?: number;
}

interface PoliceStationMapProps {
  userLocation: { lat: number; lon: number } | null;
  policeStations: PoliceStation[];
}

const PoliceStationMap = ({ userLocation, policeStations }: PoliceStationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center
  const center: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lon] 
    : defaultCenter;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView(center, userLocation ? 14 : 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map view when user location changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 14);
    }
  }, [userLocation]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add user marker
    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup("<strong>📍 You are here</strong>");
      markersRef.current.push(userMarker);
    }

    // Add police station markers
    policeStations.forEach((station) => {
      if (!mapInstanceRef.current) return;
      
      const popupContent = `
        <div style="font-size: 14px;">
          <strong>🚔 ${station.name}</strong>
          ${station.address ? `<p style="margin-top: 4px; font-size: 12px;">${station.address}</p>` : ""}
          ${station.distance !== undefined ? `<p style="margin-top: 4px; font-size: 12px; font-weight: 500;">${station.distance.toFixed(2)} km away</p>` : ""}
        </div>
      `;
      
      const stationMarker = L.marker([station.lat, station.lon], { icon: policeIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent);
      markersRef.current.push(stationMarker);
    });
  }, [userLocation, policeStations]);

  return (
    <div 
      ref={mapRef} 
      className="h-[400px] w-full rounded-lg overflow-hidden border border-border"
      style={{ zIndex: 0 }}
    />
  );
};

export default PoliceStationMap;
