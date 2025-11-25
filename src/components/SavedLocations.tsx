import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Star, Trash2, Home, Plus, Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SavedLocation {
  id: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  is_favorite: boolean;
  is_default: boolean;
  nickname?: string;
}

interface LocationSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

export const SavedLocations = () => {
  const { toast } = useToast();
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    loadSavedLocations();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSavedLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("is_favorite", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedLocations(data || []);
    } catch (error) {
      console.error("Error loading saved locations:", error);
      toast({
        title: "Error",
        description: "Failed to load saved locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (suggestion: LocationSuggestion) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setAdding(true);
      const { error } = await supabase
        .from("saved_locations")
        .insert({
          user_id: user.id,
          location_name: suggestion.display_name,
          location_lat: parseFloat(suggestion.lat),
          location_lng: parseFloat(suggestion.lon),
          is_favorite: false,
          is_default: false,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location saved successfully",
      });

      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      loadSavedLocations();
    } catch (error) {
      console.error("Error adding location:", error);
      toast({
        title: "Error",
        description: "Failed to save location",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("saved_locations")
        .update({ is_favorite: !currentValue })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: currentValue ? "Removed from favorites" : "Added to favorites",
      });

      loadSavedLocations();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const setDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_locations")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default location updated",
      });

      loadSavedLocations();
    } catch (error) {
      console.error("Error setting default:", error);
      toast({
        title: "Error",
        description: "Failed to set default location",
        variant: "destructive",
      });
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_locations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Location deleted successfully",
      });

      loadSavedLocations();
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive",
      });
    }
  };

  const startEditing = (location: SavedLocation) => {
    setEditingId(location.id);
    setEditNickname(location.nickname || location.location_name.split(",")[0]);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditNickname("");
  };

  const updateNickname = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_locations")
        .update({ nickname: editNickname.trim() || null })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Nickname updated successfully",
      });

      setEditingId(null);
      setEditNickname("");
      loadSavedLocations();
    } catch (error) {
      console.error("Error updating nickname:", error);
      toast({
        title: "Error",
        description: "Failed to update nickname",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Saved Locations
        </CardTitle>
        <CardDescription>
          Save your favorite locations for quick access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Location */}
        <div className="space-y-2">
          <Label htmlFor="location-search">Add New Location</Label>
          <div className="relative">
            <Input
              id="location-search"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0"
                    onClick={() => handleAddLocation(suggestion)}
                    disabled={adding}
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm">{suggestion.display_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {loadingSuggestions && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Saved Locations List */}
        {savedLocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved locations yet</p>
            <p className="text-xs">Search and add locations above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedLocations.map((location) => (
              <div
                key={location.id}
                className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              >
                {editingId === location.id ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`nickname-${location.id}`} className="text-xs">
                        Custom Nickname
                      </Label>
                      <Input
                        id={`nickname-${location.id}`}
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        placeholder="e.g., Home, Work, Gym"
                        className="mt-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Original: {location.location_name}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateNickname(location.id)}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium text-sm truncate">
                          {location.nickname || location.location_name.split(",")[0]}
                        </h4>
                        {location.is_default && (
                          <Badge variant="default" className="text-xs">
                            <Home className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {location.is_favorite && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Favorite
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {location.location_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => startEditing(location)}
                        title="Edit nickname"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => toggleFavorite(location.id, location.is_favorite)}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            location.is_favorite ? "fill-yellow-500 text-yellow-500" : ""
                          }`}
                        />
                      </Button>
                      {!location.is_default && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setDefault(location.id)}
                          title="Set as default"
                        >
                          <Home className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteLocation(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
