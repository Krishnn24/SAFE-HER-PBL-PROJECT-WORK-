import { MapPin, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PoliceStation } from "./PoliceStationMap";

interface PoliceStationListProps {
  stations: PoliceStation[];
  loading: boolean;
  userLocation?: { lat: number; lon: number } | null;
}

const PoliceStationList = ({ stations, loading, userLocation }: PoliceStationListProps) => {
  const openDirections = (station: PoliceStation) => {
    // Google Maps directions URL — works on desktop (opens Maps web) and on
    // mobile (opens the Google Maps app if installed). Falls back to just
    // the destination if we don't have the user's origin for some reason.
    const destination = `${station.lat},${station.lon}`;
    const url = userLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lon}&destination=${destination}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${destination}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-muted/50 rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No police stations found nearby.</p>
        <p className="text-sm mt-1">Try searching a different location.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto">
      {stations.map((station, index) => (
        <div
          key={station.id}
          className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <h4 className="font-medium text-foreground truncate">
                  {station.name}
                </h4>
              </div>
              {station.address && (
                <p className="text-sm text-muted-foreground mt-1 ml-8 line-clamp-2">
                  {station.address}
                </p>
              )}
            </div>
            {station.distance !== undefined && (
              <div className="flex items-center gap-1 text-sm font-medium text-primary whitespace-nowrap">
                <Navigation className="w-4 h-4" />
                {station.distance.toFixed(2)} km
              </div>
            )}
          </div>

          <div className="mt-3 ml-8">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => openDirections(station)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Get Directions
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PoliceStationList;
