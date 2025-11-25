import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Check, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  full_name: string;
  skill_level: string;
  bio?: string;
  is_public: boolean;
  location_name?: string;
  activities: string[];
  connectionStatus?: "none" | "pending" | "accepted";
}

interface BuddySearchProps {
  currentUserId: string;
  onRefreshBuddies?: () => void;
}

const BuddySearch = ({ currentUserId, onRefreshBuddies }: BuddySearchProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<"name" | "location">("name");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

  // Location autocomplete
  useEffect(() => {
    if (searchQuery.length < 3 || searchMode !== "location") {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingLocationSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery
          )}&format=json&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'FitnessBuddyApp/1.0'
            }
          }
        );
        const data = await response.json();
        setLocationSuggestions(data);
        setShowLocationSuggestions(true);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        setLocationSuggestions([]);
      } finally {
        setLoadingLocationSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMode]);

  // Search buddies by name or location
  useEffect(() => {
    if (searchMode === "location" && !selectedLocation) {
      setSearchResults([]);
      return;
    }

    if (searchMode === "name" && searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchBuddies = async () => {
      setIsSearching(true);
      try {
        let query = supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            skill_level,
            bio,
            is_public,
            location_lat,
            location_lng,
            activity_preferences (activity_type)
          `)
          .neq("id", currentUserId);

        if (searchMode === "name") {
          query = query.or(`full_name.ilike.%${searchQuery}%`);
        } else if (searchMode === "location" && selectedLocation) {
          // Get all profiles with location data
          query = query
            .not("location_lat", "is", null)
            .not("location_lng", "is", null);
        }

        const { data: profiles, error } = await query.limit(50);

        if (error) throw error;

        let processedProfiles = profiles || [];

        // Calculate distance for location search
        if (searchMode === "location" && selectedLocation) {
          processedProfiles = processedProfiles
            .map(profile => {
              if (!profile.location_lat || !profile.location_lng) return null;
              
              const distance = calculateDistance(
                selectedLocation.lat,
                selectedLocation.lng,
                profile.location_lat,
                profile.location_lng
              );
              
              return { ...profile, distance };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null && p.distance <= 50) // Within 50km
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);
        }

        // Get connection statuses for all results
        const userIds = processedProfiles.map(p => p.id);
        const { data: connections } = await supabase
          .from("buddy_connections")
          .select("requester_id, receiver_id, status")
          .or(`requester_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .in("requester_id", [...userIds, currentUserId])
          .in("receiver_id", [...userIds, currentUserId]);

        // Map connection statuses
        const connectionMap = new Map<string, string>();
        connections?.forEach(conn => {
          const otherId = conn.requester_id === currentUserId ? conn.receiver_id : conn.requester_id;
          connectionMap.set(otherId, conn.status);
        });

        const formattedResults: SearchResult[] = processedProfiles.map(profile => ({
          id: profile.id,
          full_name: profile.full_name,
          skill_level: profile.skill_level || "beginner",
          bio: profile.bio,
          is_public: profile.is_public,
          activities: profile.activity_preferences?.map((p: any) => p.activity_type) || [],
          connectionStatus: connectionMap.get(profile.id) as any || "none",
        }));

        setSearchResults(formattedResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchBuddies, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, currentUserId, searchMode, selectedLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleLocationSelect = (place: any) => {
    setSelectedLocation({
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      name: place.display_name
    });
    setSearchQuery(place.display_name);
    setShowLocationSuggestions(false);
  };

  const handleSendRequest = async (buddyId: string) => {
    try {
      const { error } = await supabase
        .from("buddy_connections")
        .insert({
          requester_id: currentUserId,
          receiver_id: buddyId,
          status: "pending",
        });

      if (error) throw error;

      setPendingRequests(prev => new Set(prev).add(buddyId));
      
      toast({
        title: "Request sent!",
        description: "Your buddy request has been sent",
      });

      // Update search results to reflect new status
      setSearchResults(prev =>
        prev.map(result =>
          result.id === buddyId
            ? { ...result, connectionStatus: "pending" }
            : result
        )
      );

      if (onRefreshBuddies) {
        onRefreshBuddies();
      }
    } catch (error) {
      console.error("Error sending request:", error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const getConnectionButton = (result: SearchResult) => {
    if (result.connectionStatus === "accepted") {
      return (
        <Badge variant="secondary" className="gap-1">
          <Check className="h-3 w-3" />
          Connected
        </Badge>
      );
    }

    if (result.connectionStatus === "pending" || pendingRequests.has(result.id)) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          handleSendRequest(result.id);
        }}
      >
        <UserPlus className="h-4 w-4 mr-1" />
        Connect
      </Button>
    );
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Search Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={searchMode === "name" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSearchMode("name");
                setSelectedLocation(null);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="flex-1"
            >
              Search by Name
            </Button>
            <Button
              variant={searchMode === "location" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSearchMode("location");
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="flex-1"
            >
              Search by Location
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Command className="rounded-lg border-0">
              <CommandInput
                placeholder={
                  searchMode === "name" 
                    ? "Search buddies by name..." 
                    : "Search by location (e.g., Brisbane, Sydney)..."
                }
                value={searchQuery}
                onValueChange={setSearchQuery}
                onFocus={() => {
                  if (searchMode === "location" && locationSuggestions.length > 0) {
                    setShowLocationSuggestions(true);
                  }
                }}
              />
              
              {/* Location Suggestions Dropdown */}
              {searchMode === "location" && showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                  {locationSuggestions.map((place, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                      onClick={() => handleLocationSelect(place)}
                    >
                      {place.display_name}
                    </button>
                  ))}
                </div>
              )}

              <CommandList>
                {searchMode === "name" && searchQuery.length >= 2 && (
                  <>
                    <CommandEmpty>
                      {isSearching ? "Searching..." : "No buddies found"}
                    </CommandEmpty>
                    {searchResults.length > 0 && (
                      <CommandGroup heading="Search Results">
                        {searchResults.map((result) => (
                          <CommandItem
                            key={result.id}
                            onSelect={() => setSelectedResult(result)}
                            className="p-3 cursor-pointer hover:bg-accent"
                          >
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <Avatar>
                                  <AvatarFallback>
                                    {result.full_name.split(" ").map(n => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{result.full_name}</p>
                                    {result.is_public && (
                                      <Badge variant="outline" className="text-xs">Public</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="capitalize">{result.skill_level}</span>
                                    {result.activities.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{result.activities.slice(0, 2).join(", ")}</span>
                                      </>
                                    )}
                                  </div>
                                  {result.bio && (
                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                      {result.bio}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {getConnectionButton(result)}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}

                {searchMode === "location" && selectedLocation && (
                  <>
                    <CommandEmpty>
                      {isSearching ? "Searching..." : "No buddies found near this location"}
                    </CommandEmpty>
                    {searchResults.length > 0 && (
                      <CommandGroup heading={`Buddies near ${selectedLocation.name.split(',')[0]}`}>
                        {searchResults.map((result) => (
                          <CommandItem
                            key={result.id}
                            onSelect={() => setSelectedResult(result)}
                            className="p-3 cursor-pointer hover:bg-accent"
                          >
                            <div className="flex items-center justify-between w-full gap-3">
                              <div className="flex items-center gap-3 flex-1">
                                <Avatar>
                                  <AvatarFallback>
                                    {result.full_name.split(" ").map(n => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{result.full_name}</p>
                                    {result.is_public && (
                                      <Badge variant="outline" className="text-xs">Public</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="capitalize">{result.skill_level}</span>
                                    {result.activities.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{result.activities.slice(0, 2).join(", ")}</span>
                                      </>
                                    )}
                                  </div>
                                  {result.bio && (
                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                      {result.bio}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {getConnectionButton(result)}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </div>

          {searchMode === "location" && loadingLocationSuggestions && (
            <p className="text-xs text-muted-foreground text-center">
              Loading location suggestions...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BuddySearch;
