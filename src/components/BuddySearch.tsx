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

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchBuddies = async () => {
      setIsSearching(true);
      try {
        // Search profiles by name or location
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            skill_level,
            bio,
            is_public,
            activity_preferences (activity_type)
          `)
          .or(`full_name.ilike.%${searchQuery}%`)
          .neq("id", currentUserId)
          .limit(10);

        if (error) throw error;

        // Get connection statuses for all results
        const userIds = profiles?.map(p => p.id) || [];
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

        const formattedResults: SearchResult[] = (profiles || []).map(profile => ({
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
  }, [searchQuery, currentUserId]);

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
        <Command className="rounded-lg border-0">
          <CommandInput
            placeholder="Search buddies by name or location..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {searchQuery.length >= 2 && (
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
          </CommandList>
        </Command>
      </CardContent>
    </Card>
  );
};

export default BuddySearch;
