import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Loader2 } from "lucide-react";

export const LocationManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [manualLocation, setManualLocation] = useState({ lat: "", lng: "" });

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("location_lat, location_lng")
        .eq("id", user.id)
        .single();

      if (data?.location_lat && data?.location_lng) {
        setCurrentLocation({ lat: data.location_lat, lng: data.location_lng });
        setManualLocation({ 
          lat: data.location_lat.toString(), 
          lng: data.location_lng.toString() 
        });
      }
    } catch (error) {
      console.error("Error loading location:", error);
    }
  };

  const getDeviceLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        await updateLocation(lat, lng);
        setCurrentLocation({ lat, lng });
        setManualLocation({ lat: lat.toString(), lng: lng.toString() });
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        toast({
          title: "Location error",
          description: error.message === "User denied Geolocation"
            ? "Please enable location permissions in your browser"
            : "Failed to get your location. Please try manual input.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const updateLocation = async (lat: number, lng: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ location_lat: lat, location_lng: lng })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    }
  };

  const handleManualUpdate = async () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid input",
        description: "Please enter valid latitude and longitude",
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast({
        title: "Invalid coordinates",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    await updateLocation(lat, lng);
    setCurrentLocation({ lat, lng });
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Settings
        </CardTitle>
        <CardDescription>
          Set your location to find nearby activity buddies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentLocation && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm font-medium mb-1">Current Location</p>
            <p className="text-xs text-muted-foreground">
              Latitude: {currentLocation.lat.toFixed(6)}, Longitude: {currentLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={getDeviceLocation}
            disabled={loading}
            className="w-full"
            variant="default"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Use Current Device Location
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                placeholder="e.g., 28.7041"
                value={manualLocation.lat}
                onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                placeholder="e.g., 77.1025"
                value={manualLocation.lng}
                onChange={(e) => setManualLocation({ ...manualLocation, lng: e.target.value })}
              />
            </div>
          </div>

          <Button
            onClick={handleManualUpdate}
            disabled={loading || !manualLocation.lat || !manualLocation.lng}
            variant="outline"
            className="w-full"
          >
            Update Location Manually
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Tip: Use{" "}
          <a
            href="https://www.latlong.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            latlong.net
          </a>{" "}
          to find coordinates for any address
        </p>
      </CardContent>
    </Card>
  );
};
