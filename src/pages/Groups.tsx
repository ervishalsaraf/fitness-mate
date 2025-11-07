import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, MapPin, Users, Copy, Check, Plus, Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { z } from "zod";
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addHours } from 'date-fns';
import EventComments from "@/components/EventComments";


const createGroupSchema = (locationTimezone: string) => z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  activity_type: z.enum(["running", "cycling", "gym", "swimming", "yoga", "hiking", "cricket", "football", "basketball"]),
  location_name: z.string().min(2, "Location name required").max(200),
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  scheduled_time: z.string().min(1, "Scheduled time required").refine((dateString) => {
    try {
      // Parse the input datetime-local value (which is in the browser's local timezone)
      const selectedDate = new Date(dateString);
      
      // Get current time in the location's timezone
      const nowInLocationTz = toZonedTime(new Date(), locationTimezone);
      const sixHoursFromNowInLocationTz = addHours(nowInLocationTz, 6);
      
      // Convert selected date to location's timezone for comparison
      const selectedDateInLocationTz = toZonedTime(selectedDate, locationTimezone);
      
      if (selectedDateInLocationTz < nowInLocationTz) {
        return false;
      }
      if (selectedDateInLocationTz < sixHoursFromNowInLocationTz) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Timezone validation error:', error);
      return false;
    }
  }, {
    message: "Event must be scheduled at least 6 hours from now (in the event location's timezone)"
  }),
  max_participants: z.number().int().min(2).max(100),
  visibility: z.enum(["public", "private"]),
});

interface Group {
  id: string;
  title: string;
  description: string | null;
  activity_type: string;
  location_name: string;
  scheduled_time: string;
  max_participants: number;
  visibility: string;
  invite_code: string | null;
  creator_id: string;
  member_count: number;
  allow_comments: boolean;
  comments_public: boolean;
  is_member: boolean;
}

// Activity categories for filtering
const activityCategories = {
  all: {
    name: "All Activities",
    activities: [] as string[], // Empty array means show all
  },
  "team-sports": {
    name: "Team Sports",
    activities: ["cricket", "football", "basketball", "volleyball"] as string[],
  },
  "racket-sports": {
    name: "Racket Sports",
    activities: ["badminton", "snooker"] as string[],
  },
  "individual-fitness": {
    name: "Individual Fitness",
    activities: ["running", "cycling", "gym", "swimming", "yoga", "hiking"] as string[],
  },
};

type CategoryKey = keyof typeof activityCategories;

const Groups = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    activity_type: "running",
    location_name: "",
    location_lat: 0,
    location_lng: 0,
    scheduled_time: "",
    max_participants: 10,
    visibility: "public",
    allow_comments: true,
    comments_public: true,
  });
  const [locationTimezone, setLocationTimezone] = useState<string>("UTC");
  const [fetchingTimezone, setFetchingTimezone] = useState(false);
  const [locationInputValue, setLocationInputValue] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Debounced search for location suggestions
  useEffect(() => {
    if (locationInputValue.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            locationInputValue
          )}&format=json&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'FitnessBuddyApp/1.0'
            }
          }
        );
        const data = await response.json();
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        setLocationSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInputValue]);

  const handleLocationSelect = (place: any) => {
    setFormData({
      ...formData,
      location_name: place.display_name,
      location_lat: parseFloat(place.lat),
      location_lng: parseFloat(place.lon),
    });
    setLocationInputValue(place.display_name);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const inviteCode = searchParams.get("invite");
    if (inviteCode && user) {
      handleJoinViaInvite(inviteCode);
    }
  }, [searchParams, user]);

  useEffect(() => {
    const fetchTimezone = async () => {
      if (formData.location_lat === 0 && formData.location_lng === 0) {
        return;
      }

      setFetchingTimezone(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-timezone', {
          body: { lat: formData.location_lat, lng: formData.location_lng }
        });

        if (error) throw error;
        
        if (data?.timezone) {
          setLocationTimezone(data.timezone);
        }
      } catch (error) {
        console.error('Error fetching timezone:', error);
        toast({
          title: "Timezone detection",
          description: "Could not detect timezone for this location. Using UTC.",
          variant: "default",
        });
        setLocationTimezone('UTC');
      } finally {
        setFetchingTimezone(false);
      }
    };

    fetchTimezone();
  }, [formData.location_lat, formData.location_lng]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    loadGroups();
  };

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          *,
          group_members(count)
        `)
        .order("scheduled_time", { ascending: true });

      if (error) throw error;

      const formattedGroups = await Promise.all((data || []).map(async (group: any) => {
        // Check if current user is a member
        const { data: memberData } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user?.id)
          .maybeSingle();

        return {
          ...group,
          member_count: group.group_members?.[0]?.count || 0,
          is_member: !!memberData,
        };
      }));

      setGroups(formattedGroups);
    } catch (error) {
      console.error("Error loading groups:", error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinViaInvite = async (inviteCode: string) => {
    try {
      // Find group by invite code
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id, title")
        .eq("invite_code", inviteCode)
        .single();

      if (groupError || !group) {
        toast({
          title: "Invalid invite",
          description: "This invite link is not valid",
          variant: "destructive",
        });
        return;
      }

      // Add user to group_invites
      const { error: inviteError } = await supabase
        .from("group_invites")
        .insert({ group_id: group.id, user_id: user.id });

      if (inviteError) {
        if (inviteError.code === "23505") {
          toast({
            title: "Already joined",
            description: "You've already accepted this invite",
          });
        } else {
          throw inviteError;
        }
      } else {
        // Also add to group_members
        await supabase
          .from("group_members")
          .insert({ group_id: group.id, user_id: user.id });

        toast({
          title: "Joined successfully!",
          description: `You've joined ${group.title}`,
        });
        loadGroups();
      }
    } catch (error) {
      console.error("Error joining via invite:", error);
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      });
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = createGroupSchema(locationTimezone).safeParse(formData);
    if (!result.success) {
      toast({
        title: "Validation error",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("groups")
        .insert({
          title: formData.title,
          description: formData.description || null,
          activity_type: formData.activity_type as any,
          location_name: formData.location_name,
          location_lat: formData.location_lat,
          location_lng: formData.location_lng,
          scheduled_time: formData.scheduled_time,
          max_participants: formData.max_participants,
          visibility: formData.visibility as any,
          creator_id: user.id,
          allow_comments: formData.allow_comments,
          comments_public: formData.comments_public,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator as a member
      await supabase
        .from("group_members")
        .insert({ group_id: data.id, user_id: user.id });

      toast({
        title: "Group created!",
        description: formData.visibility === "private" 
          ? "Share the invite link with others to join" 
          : "Your group is now visible to everyone",
      });

      setCreateDialogOpen(false);
      loadGroups();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        activity_type: "running",
        location_name: "",
        location_lat: 0,
        location_lng: 0,
        scheduled_time: "",
        max_participants: 10,
        visibility: "public",
        allow_comments: true,
        comments_public: true,
      });
      setLocationInputValue("");
    } catch (error) {
      console.error("Error creating group:", error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: groupId, user_id: user.id });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already joined",
            description: "You're already a member of this group",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Joined successfully!",
          description: "You've joined the group",
        });
        loadGroups();
      }
    } catch (error) {
      console.error("Error joining group:", error);
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const url = `${window.location.origin}/groups?invite=${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const shareViaWhatsApp = (inviteCode: string, groupTitle: string) => {
    const url = `${window.location.origin}/groups?invite=${inviteCode}`;
    const text = `Join me for ${groupTitle}!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const shareViaSMS = (inviteCode: string, groupTitle: string) => {
    const url = `${window.location.origin}/groups?invite=${inviteCode}`;
    const text = `Join me for ${groupTitle}! ${url}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  const shareViaFacebook = (inviteCode: string) => {
    const url = `${window.location.origin}/groups?invite=${inviteCode}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareViaTwitter = (inviteCode: string, groupTitle: string) => {
    const url = `${window.location.origin}/groups?invite=${inviteCode}`;
    const text = `Join me for ${groupTitle}!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  // Combined referral + event invite sharing
  const getReferralEventLink = async (inviteCode: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      let referralCode = profile?.referral_code;
      
      if (!referralCode) {
        referralCode = await generateAndSaveReferralCode();
      }

      return `${window.location.origin}/auth?ref=${referralCode}&event=${inviteCode}`;
    } catch (error) {
      console.error('Error getting referral link:', error);
      return null;
    }
  };

  const generateAndSaveReferralCode = async () => {
    const { data, error } = await supabase.rpc('generate_referral_code');
    if (error) throw error;
    
    await supabase
      .from('profiles')
      .update({ referral_code: data })
      .eq('id', user.id);
    
    return data;
  };

  const shareReferralWithEvent = async (inviteCode: string, groupTitle: string) => {
    const combinedUrl = await getReferralEventLink(inviteCode);
    if (!combinedUrl) {
      toast({
        title: "Error",
        description: "Failed to generate invite link",
        variant: "destructive",
      });
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join Fit Connect24 & ${groupTitle}`,
          text: `Join me on Fit Connect24 and come to ${groupTitle}! 💪`,
          url: combinedUrl,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(combinedUrl);
      toast({
        title: "Copied!",
        description: "Invite link (with referral) copied to clipboard",
      });
    }
  };

  const shareReferralEventViaWhatsApp = async (inviteCode: string, groupTitle: string) => {
    const combinedUrl = await getReferralEventLink(inviteCode);
    if (!combinedUrl) return;
    
    const text = `Join me on Fit Connect24 and come to ${groupTitle}! 💪`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + combinedUrl)}`, '_blank');
  };

  const shareReferralEventViaSMS = async (inviteCode: string, groupTitle: string) => {
    const combinedUrl = await getReferralEventLink(inviteCode);
    if (!combinedUrl) return;
    
    const text = `Join me on Fit Connect24 and come to ${groupTitle}! ${combinedUrl}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Groups & Events
          </h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Set up a new fitness event. Choose public for everyone to see, or private to share with specific people.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Morning Run in Central Park"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="A casual 5k run through the park"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="activity_type">Activity Type *</Label>
                  <Select
                    value={formData.activity_type}
                    onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="cycling">Cycling</SelectItem>
                      <SelectItem value="gym">Gym</SelectItem>
                      <SelectItem value="swimming">Swimming</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="hiking">Hiking</SelectItem>
                      <SelectItem value="cricket">Cricket</SelectItem>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="badminton">Badminton</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="snooker">Snooker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative">
                  <Label htmlFor="location_name">Location *</Label>
                  <Input
                    id="location_name"
                    value={locationInputValue}
                    onChange={(e) => {
                      setLocationInputValue(e.target.value);
                      setFormData({ ...formData, location_name: e.target.value });
                    }}
                    onFocus={() => locationSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Search for a location..."
                    required
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {loadingSuggestions ? "Searching..." : "Start typing to see location suggestions (min 3 characters)"}
                  </p>
                  
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      {locationSuggestions.map((place, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border last:border-b-0 text-sm"
                          onClick={() => handleLocationSelect(place)}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                            <span className="line-clamp-2">{place.display_name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {formData.location_lat !== 0 && formData.location_lng !== 0 && (
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md flex items-start gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Coordinates detected</div>
                      <div className="mt-0.5">
                        {formData.location_lat.toFixed(6)}, {formData.location_lng.toFixed(6)}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="scheduled_time">Scheduled Time *</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    min={new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 6 hours from now in the event location's timezone
                    {locationTimezone !== 'UTC' && ` (${locationTimezone})`}
                    {fetchingTimezone && ' - Detecting timezone...'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="2"
                    max="100"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label>Event Visibility *</Label>
                  <RadioGroup
                    value={formData.visibility}
                    onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="font-normal cursor-pointer">
                        Public - Visible to everyone in your area
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="font-normal cursor-pointer">
                        Private - Only visible via invite link
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <Label>Comment Settings</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="allow_comments" className="font-normal">
                        Allow comments on this event
                      </Label>
                      <Switch
                        id="allow_comments"
                        checked={formData.allow_comments}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_comments: checked })
                        }
                      />
                    </div>
                    
                    {formData.allow_comments && (
                      <RadioGroup
                        value={formData.comments_public ? "public" : "private"}
                        onValueChange={(value) => 
                          setFormData({ ...formData, comments_public: value === "public" })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="public" id="comments-public" />
                          <Label htmlFor="comments-public" className="font-normal cursor-pointer">
                            Public comments - All members can see comments
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="private" id="comments-private" />
                          <Label htmlFor="comments-private" className="font-normal cursor-pointer">
                            Private comments - Only you see comments
                          </Label>
                        </div>
                      </RadioGroup>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">Create Event</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(activityCategories) as CategoryKey[]).map((categoryKey) => {
              const category = activityCategories[categoryKey];
              const isActive = selectedCategory === categoryKey;
              
              return (
                <Button
                  key={categoryKey}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(categoryKey)}
                  className="transition-all"
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading events...</div>
        ) : (() => {
          // Filter groups based on selected category
          const filteredGroups = selectedCategory === "all" 
            ? groups 
            : groups.filter(group => 
                activityCategories[selectedCategory].activities.includes(group.activity_type)
              );
          
          return filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 space-y-4">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">
                    {selectedCategory === "all" 
                      ? "No events found" 
                      : `No ${activityCategories[selectedCategory].name.toLowerCase()} events found`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategory === "all" 
                      ? "Create your first event to get started" 
                      : "Try selecting a different category or create a new event"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{group.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {group.activity_type.charAt(0).toUpperCase() + group.activity_type.slice(1)}
                      </CardDescription>
                    </div>
                    {group.visibility === "private" && group.creator_id === user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyInviteLink(group.invite_code!)}>
                            <Copy className="h-4 w-4 mr-2" />
                            {copiedCode === group.invite_code ? "Copied!" : "Copy Link"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareViaWhatsApp(group.invite_code!, group.title)}>
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareViaSMS(group.invite_code!, group.title)}>
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                            </svg>
                            Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareViaFacebook(group.invite_code!)}>
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => shareViaTwitter(group.invite_code!, group.title)}>
                            <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          Twitter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {group.visibility === 'private' && group.invite_code && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-8">
                          <Users className="h-4 w-4 mr-2" />
                          Invite Friend
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => shareReferralWithEvent(group.invite_code!, group.title)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Invite
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareReferralEventViaWhatsApp(group.invite_code!, group.title)}>
                          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          WhatsApp
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shareReferralEventViaSMS(group.invite_code!, group.title)}>
                          <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                          </svg>
                          Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{group.location_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(group.scheduled_time).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.member_count} / {group.max_participants} participants</span>
                    </div>
                  </div>

                  {group.creator_id !== user?.id && (
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={group.member_count >= group.max_participants}
                    >
                      {group.member_count >= group.max_participants ? "Full" : "Join Event"}
                    </Button>
                  )}

                  {(group.is_member || group.creator_id === user?.id) && (
                    <div className="mt-4 pt-4 border-t">
                      <EventComments
                        groupId={group.id}
                        isOrganizer={group.creator_id === user?.id}
                        isMember={group.is_member}
                        allowComments={group.allow_comments}
                        commentsPublic={group.comments_public}
                        currentUserId={user?.id}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
                ))}
              </div>
            );
          })()
        }
      </main>
    </div>
  );
};

export default Groups;
