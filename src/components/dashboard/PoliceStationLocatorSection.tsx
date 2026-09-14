import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Search, Loader2, AlertCircle, Shield } from "lucide-react";
import { toast } from "sonner";
import PoliceStationMap, { type PoliceStation } from "./PoliceStationMap";
import PoliceStationList from "./PoliceStationList";

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Public Overpass API instances, tried in order. The default overpass-api.de
// instance is a shared community server that frequently returns 429/504 or
// times out under load — falling back to mirrors avoids the feature dying
// outright whenever that one instance is unhappy.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
];

const buildOverpassQuery = (lat: number, lon: number, radiusMeters: number) => `
  [out:json][timeout:25];
  (
    node["amenity"="police"](around:${radiusMeters},${lat},${lon});
    way["amenity"="police"](around:${radiusMeters},${lat},${lon});
    relation["amenity"="police"](around:${radiusMeters},${lat},${lon});
  );
  out center;
`;

// Try each Overpass mirror in turn (each with its own timeout) until one
// returns a usable response. Throws only if every mirror fails.
const queryOverpassWithFallback = async (query: string): Promise<any> => {
  let lastError: unknown = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 429/504 etc — try the next mirror instead of giving up
        lastError = new Error(`Overpass endpoint ${endpoint} returned ${response.status}`);
        continue;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      // network error, CORS rejection, or abort — try the next mirror
      continue;
    }
  }

  throw lastError ?? new Error("All Overpass endpoints failed");
};

const PoliceStationLocatorSection = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState("");

  const parseStations = useCallback((data: any, lat: number, lon: number): PoliceStation[] => {
    return (data.elements || [])
      .map((element: any) => {
        const stationLat = element.lat || element.center?.lat;
        const stationLon = element.lon || element.center?.lon;

        if (!stationLat || !stationLon) return null;

        const distance = calculateDistance(lat, lon, stationLat, stationLon);

        return {
          id: element.id.toString(),
          name: element.tags?.name || "Police Station",
          address: element.tags?.["addr:full"] ||
                   element.tags?.["addr:street"] ||
                   element.tags?.description ||
                   "Address not available",
          lat: stationLat,
          lon: stationLon,
          distance,
        };
      })
      .filter(Boolean)
      .sort((a: PoliceStation, b: PoliceStation) => (a.distance || 0) - (b.distance || 0));
  }, []);

  // Fetch police stations from Overpass API, with mirror fallback and a
  // widened-radius retry if the first pass turns up nothing (OSM's police
  // station tagging is sparse in a lot of areas, especially in India).
  const fetchPoliceStations = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);

    try {
      let data = await queryOverpassWithFallback(buildOverpassQuery(lat, lon, 10000));
      let stations = parseStations(data, lat, lon);

      if (stations.length === 0) {
        // Widen to 25km before declaring "none found"
        data = await queryOverpassWithFallback(buildOverpassQuery(lat, lon, 25000));
        stations = parseStations(data, lat, lon);
      }

      setPoliceStations(stations);

      if (stations.length === 0) {
        toast.info("No police stations found within 25km radius");
      } else {
        toast.success(`Found ${stations.length} police station${stations.length > 1 ? "s" : ""} nearby`);
      }
    } catch (err) {
      console.error("Error fetching police stations:", err);
      setError(
        "Couldn't reach the police station database right now (the map service may be temporarily overloaded). Please try again in a moment."
      );
      toast.error("Failed to fetch police stations");
    } finally {
      setLoading(false);
    }
  }, [parseStations]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please enter your location manually.");
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setUserLocation(location);
        setGettingLocation(false);
        toast.success("Location found!");
      },
      (err) => {
        setGettingLocation(false);
        let errorMessage = "Unable to get your location. ";
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage += "Location access was denied. Please enter your location manually.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable. Please enter your location manually.";
            break;
          case err.TIMEOUT:
            errorMessage += "Request timed out. Please try again or enter your location manually.";
            break;
          default:
            errorMessage += "Please enter your location manually.";
        }
        
        setError(errorMessage);
        toast.error("Could not get your location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Search by manual location input with input validation
  const searchByManualLocation = useCallback(async () => {
    const trimmedLocation = manualLocation.trim();
    
    // Input validation
    if (!trimmedLocation) {
      toast.error("Please enter a location");
      return;
    }
    
    if (trimmedLocation.length > 200) {
      toast.error("Location must be less than 200 characters");
      return;
    }
    
    // Allow alphanumeric, spaces, commas, periods, hyphens, and common location characters
    if (!/^[a-zA-Z0-9\s,.\-'()]+$/.test(trimmedLocation)) {
      toast.error("Location contains invalid characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Nominatim to geocode the manual location
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedLocation)}&limit=1`,
        {
          headers: {
            "User-Agent": "SafeHerApp/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to find location");
      }

      const data = await response.json();

      if (data.length === 0) {
        setError("Location not found. Please try a different search term.");
        setLoading(false);
        return;
      }

      const location = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };

      setUserLocation(location);
      toast.success(`Found: ${data[0].display_name.split(",")[0]}`);
      
      // Now fetch police stations for this location
      await fetchPoliceStations(location.lat, location.lon);
    } catch (err) {
      console.error("Error searching location:", err);
      setError("Failed to find the location. Please try again.");
      setLoading(false);
    }
  }, [manualLocation, fetchPoliceStations]);

  // Find police stations near current location
  const handleFindPoliceStations = useCallback(() => {
    if (!userLocation) {
      toast.error("Please get your location first");
      return;
    }
    fetchPoliceStations(userLocation.lat, userLocation.lon);
  }, [userLocation, fetchPoliceStations]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Nearest Police Station Locator</CardTitle>
            <CardDescription>
              Find police stations near your current location for emergency assistance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            variant="outline"
            className="flex-1"
          >
            {gettingLocation ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4 mr-2" />
            )}
            {gettingLocation ? "Getting Location..." : "Use My Location"}
          </Button>
          
          <Button
            onClick={handleFindPoliceStations}
            disabled={!userLocation || loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Search className="w-4 h-4 mr-2" />
            )}
            Find Nearest Police Station
          </Button>
        </div>

        {/* Error Alert with Manual Location Input */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Manual Location Fallback */}
        {(error || !userLocation) && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Can't access your location? Enter your city or area manually:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter city, area, or address..."
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchByManualLocation()}
                className="flex-1"
              />
              <Button onClick={searchByManualLocation} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Map */}
        <PoliceStationMap userLocation={userLocation} policeStations={policeStations} />

        {/* Police Stations List */}
        {(policeStations.length > 0 || loading) && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Nearby Police Stations ({policeStations.length})
            </h3>
            <PoliceStationList stations={policeStations} loading={loading} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PoliceStationLocatorSection;
