import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Users, TrendingUp, LogOut, User as UserIcon, Plus, Crown, Zap, Filter, Sparkles, Lock, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UpgradePrompt from "@/components/UpgradePrompt";
import BuddySearch from "@/components/BuddySearch";

interface Profile {
  id: string;
  full_name: string;
  skill_level: string;
  activities: string[];
  times: string[];
  distance?: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [nearbyBuddies, setNearbyBuddies] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>("all");
  
  // Upgrade prompt state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<"filters" | "tracking">("filters");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadNearbyBuddies();
      checkSubscription();
    };

    checkAuth();
    checkAdminRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
        checkSubscription();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!error && data === true) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error("Error checking admin role:", error);
    }
  };

  const checkSubscription = async () => {
    setCheckingSubscription(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error checking subscription:", error);
        return;
      }

      if (data?.tier) {
        setSubscriptionTier(data.tier);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setCheckingSubscription(false);
    }
  };

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

  const loadNearbyBuddies = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Get current user's location
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("location_lat, location_lng")
        .eq("id", user.id)
        .single();

      // Only fetch profiles of accepted buddy connections
      const { data, error } = await supabase
        .from("buddy_connections")
        .select(`
          id,
          status,
          requester_id,
          receiver_id,
          requester:profiles!buddy_connections_requester_id_fkey (
            id,
            full_name,
            skill_level,
            location_lat,
            location_lng,
            activity_preferences (activity_type),
            time_preferences (time_slot)
          ),
          receiver:profiles!buddy_connections_receiver_id_fkey (
            id,
            full_name,
            skill_level,
            location_lat,
            location_lng,
            activity_preferences (activity_type),
            time_preferences (time_slot)
          )
        `)
        .eq("status", "accepted");

      if (error) {
        console.error("Error loading buddies:", error);
        setLoading(false);
        return;
      }

      // Format the data - get the profile that is NOT the current user
      const formattedProfiles: Profile[] = (data || []).map((connection: any) => {
        const profile = connection.requester_id === user.id 
          ? connection.receiver 
          : connection.requester;
        
        let distance: number | undefined;
        if (currentUserProfile?.location_lat && currentUserProfile?.location_lng && 
            profile.location_lat && profile.location_lng) {
          distance = calculateDistance(
            currentUserProfile.location_lat,
            currentUserProfile.location_lng,
            profile.location_lat,
            profile.location_lng
          );
        }
        
        return {
          id: profile.id,
          full_name: profile.full_name,
          skill_level: profile.skill_level,
          activities: profile.activity_preferences?.map((p: any) => p.activity_type) || [],
          times: profile.time_preferences?.map((p: any) => p.time_slot) || [],
          distance: distance ? parseFloat(distance.toFixed(1)) : undefined,
        };
      });

      setNearbyBuddies(formattedProfiles);
    } catch (error) {
      console.error("Error loading buddies:", error);
      toast({
        title: "Error",
        description: "Failed to load buddy connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
  };

  const handleConnect = async (buddyId: string) => {
    if (!user) return;

    const { error } = await supabase.from("buddy_connections").insert({
      requester_id: user.id,
      receiver_id: buddyId,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Request sent!",
        description: "Your buddy request has been sent",
      });
    }
  };

  const handleCreateEvent = () => {
    if (!user) {
      toast({
        title: "Sign up required",
        description: "Please sign up to create events",
      });
      navigate("/auth");
      return;
    }
    navigate("/groups");
  };

  const handleAdvancedFilterClick = () => {
    if (subscriptionTier === "free") {
      setUpgradeFeature("filters");
      setShowUpgradePrompt(true);
    }
  };

  const handleAISuggestionsClick = () => {
    if (subscriptionTier === "free") {
      setUpgradeFeature("tracking");
      setShowUpgradePrompt(true);
    } else {
      toast({
        title: "AI Suggestions",
        description: "AI match suggestions coming soon for premium users!",
      });
    }
  };

  // Filter buddies based on selected filters
  const filteredBuddies = useMemo(() => {
    return nearbyBuddies.filter(buddy => {
      // Activity filter
      if (selectedActivity !== "all" && !buddy.activities.includes(selectedActivity)) {
        return false;
      }
      
      // Distance filter
      if (buddy.distance && buddy.distance > maxDistance) {
        return false;
      }
      
      // Skill level filter (premium only)
      if (subscriptionTier !== "free" && selectedSkillLevel !== "all" && buddy.skill_level !== selectedSkillLevel) {
        return false;
      }
      
      return true;
    });
  }, [nearbyBuddies, selectedActivity, maxDistance, selectedSkillLevel, subscriptionTier]);

  const activeFilterCount = [
    selectedActivity !== "all",
    maxDistance < 10,
    subscriptionTier !== "free" && selectedSkillLevel !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Fit Connect24
          </h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin")}
                className="gap-2"
              >
                <Shield className="h-4 w-4 text-amber-600" />
                Admin
              </Button>
            )}
            {subscriptionTier !== "free" && (
              <Badge 
                variant={subscriptionTier === "elite" ? "default" : "secondary"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate("/subscription")}
              >
                {subscriptionTier === "elite" ? (
                  <Crown className="h-3 w-3 mr-1" />
                ) : (
                  <Zap className="h-3 w-3 mr-1" />
                )}
                {subscriptionTier.toUpperCase()}
              </Badge>
            )}
            {subscriptionTier === "free" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/pricing")}
                className="text-xs"
              >
                <Zap className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <UserIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="buddies" className="space-y-6" onValueChange={(value) => {
          if (value === "create") {
            handleCreateEvent();
          }
        }}>
          <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto">
            <TabsTrigger value="buddies">
              <Users className="h-4 w-4 mr-2" />
              Buddies
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </TabsTrigger>
            <TabsTrigger value="stats">
              <TrendingUp className="h-4 w-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapPin className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buddies" className="space-y-4">
            {/* Buddy Search */}
            <BuddySearch 
              currentUserId={user?.id} 
              onRefreshBuddies={loadNearbyBuddies}
            />

            {/* AI Suggestions Card */}
            <Card className={subscriptionTier === "free" ? "border-muted-foreground/20 bg-muted/20" : "border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5"}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${subscriptionTier === "free" ? "bg-muted" : "bg-gradient-to-br from-primary to-secondary"}`}>
                      <Sparkles className={`h-5 w-5 ${subscriptionTier === "free" ? "text-muted-foreground" : "text-white"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        AI Match Suggestions
                        {subscriptionTier === "free" && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscriptionTier === "free" 
                          ? "Get personalized buddy recommendations powered by AI"
                          : "Your best matches based on compatibility"}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAISuggestionsClick}
                    variant={subscriptionTier === "free" ? "outline" : "default"}
                    size="sm"
                  >
                    {subscriptionTier === "free" ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        View Matches
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filters Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Nearby Activity Buddies</CardTitle>
                    <CardDescription>Find people with similar interests near you</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        {activeFilterCount}
                      </Badge>
                    )}
                    {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>

              <Collapsible open={showFilters}>
                <CollapsibleContent>
                  <CardContent className="border-t pt-4 pb-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Basic Filter: Activity */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Activity Type</label>
                        <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                          <SelectTrigger>
                            <SelectValue placeholder="All activities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All activities</SelectItem>
                            <SelectItem value="running">Running</SelectItem>
                            <SelectItem value="cycling">Cycling</SelectItem>
                            <SelectItem value="gym">Gym</SelectItem>
                            <SelectItem value="yoga">Yoga</SelectItem>
                            <SelectItem value="swimming">Swimming</SelectItem>
                            <SelectItem value="basketball">Basketball</SelectItem>
                            <SelectItem value="football">Football</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Basic Filter: Distance */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Max Distance: {maxDistance} km
                        </label>
                        <Slider
                          value={[maxDistance]}
                          onValueChange={(value) => setMaxDistance(value[0])}
                          min={1}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Advanced Filter: Skill Level (Premium) */}
                      <div className="space-y-2 relative">
                        <label className="text-sm font-medium flex items-center gap-2">
                          Skill Level Match
                          {subscriptionTier === "free" && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </label>
                        <div className="relative">
                          <Select
                            value={selectedSkillLevel}
                            onValueChange={(value) => {
                              if (subscriptionTier === "free") {
                                handleAdvancedFilterClick();
                              } else {
                                setSelectedSkillLevel(value);
                              }
                            }}
                            disabled={subscriptionTier === "free"}
                          >
                            <SelectTrigger className={subscriptionTier === "free" ? "opacity-50" : ""}>
                              <SelectValue placeholder="All skill levels" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All skill levels</SelectItem>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                          {subscriptionTier === "free" && (
                            <div
                              className="absolute inset-0 cursor-pointer flex items-center justify-center"
                              onClick={handleAdvancedFilterClick}
                            >
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* More Premium Filters Teaser */}
                      {subscriptionTier === "free" && (
                        <div
                          className="space-y-2 cursor-pointer"
                          onClick={handleAdvancedFilterClick}
                        >
                          <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            More Advanced Filters
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          </label>
                          <div className="border-2 border-dashed rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                              <Lock className="h-4 w-4" />
                              <span>Age range, time slots & more</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedActivity("all");
                          setMaxDistance(10);
                          setSelectedSkillLevel("all");
                        }}
                        className="w-full"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>

              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading buddies...</div>
                ) : filteredBuddies.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-muted-foreground">
                      {nearbyBuddies.length === 0 ? "No buddies found yet" : "No buddies match your filters"}
                    </p>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSelectedActivity("all");
                          setMaxDistance(10);
                          setSelectedSkillLevel("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground px-1">
                      Showing {filteredBuddies.length} of {nearbyBuddies.length} buddies
                    </p>
                    <div className="grid gap-4">
                      {filteredBuddies.map((buddy) => (
                      <Card key={buddy.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                                  {buddy.full_name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-2">
                                <div>
                                  <h3 className="font-semibold">{buddy.full_name}</h3>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {buddy.distance} km away • {buddy.skill_level}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {buddy.activities.slice(0, 3).map((activity) => (
                                    <Badge key={activity} variant="secondary" className="text-xs">
                                      {activity}
                                    </Badge>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {buddy.times.map((time) => (
                                    <Badge key={time} variant="outline" className="text-xs">
                                      {time}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <Button onClick={() => handleConnect(buddy.id)} size="sm">
                              Connect
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle>Fitness Groups & Events</CardTitle>
                <CardDescription>Join or create local fitness groups</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Browse public events or create your own</p>
                    <Button className="mt-4" onClick={() => navigate("/groups")}>
                      View All Events
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Your Motivation Dashboard</CardTitle>
                <CardDescription>Track your progress and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Start your first activity to see stats</p>
                    <Button className="mt-4" onClick={() => navigate("/motivation")}>
                      View Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Map View</CardTitle>
                <CardDescription>See buddies on a map near you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 space-y-4 bg-muted/20 rounded-lg border-2 border-dashed">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Map integration coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Upgrade Prompts */}
      <UpgradePrompt
        open={showUpgradePrompt && upgradeFeature === "filters"}
        onOpenChange={setShowUpgradePrompt}
        title="Unlock Advanced Filters"
        description="Find your perfect fitness buddy with precision filtering"
        feature="filters"
      />
      <UpgradePrompt
        open={showUpgradePrompt && upgradeFeature === "tracking"}
        onOpenChange={setShowUpgradePrompt}
        title="Unlock AI Match Suggestions"
        description="Get personalized buddy recommendations powered by AI"
        feature="tracking"
      />
    </div>
  );
};

export default Dashboard;
