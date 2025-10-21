import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Users, TrendingUp, LogOut, User as UserIcon } from "lucide-react";

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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadNearbyBuddies();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadNearbyBuddies = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
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
            activity_preferences (activity_type),
            time_preferences (time_slot)
          ),
          receiver:profiles!buddy_connections_receiver_id_fkey (
            id,
            full_name,
            skill_level,
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
        
        return {
          id: profile.id,
          full_name: profile.full_name,
          skill_level: profile.skill_level,
          activities: profile.activity_preferences?.map((p: any) => p.activity_type) || [],
          times: profile.time_preferences?.map((p: any) => p.time_slot) || [],
          distance: Math.floor(Math.random() * 5) + 0.5, // Mock distance
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Activity Buddy
          </h1>
          <div className="flex gap-2">
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
        <Tabs defaultValue="buddies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
            <TabsTrigger value="buddies">
              <Users className="h-4 w-4 mr-2" />
              Buddies
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Calendar className="h-4 w-4 mr-2" />
              Groups
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
            <Card>
              <CardHeader>
                <CardTitle>Nearby Activity Buddies</CardTitle>
                <CardDescription>Find people with similar interests near you</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading buddies...</div>
                ) : nearbyBuddies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No buddies found yet</div>
                ) : (
                  <div className="grid gap-4">
                    {nearbyBuddies.map((buddy) => (
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
    </div>
  );
};

export default Dashboard;
