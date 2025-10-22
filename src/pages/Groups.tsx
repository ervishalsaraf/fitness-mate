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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, MapPin, Users, Copy, Check, Plus, Share2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { z } from "zod";

const groupSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  activity_type: z.enum(["running", "cycling", "gym", "swimming", "yoga", "hiking"]),
  location_name: z.string().min(2, "Location name required").max(200),
  location_lat: z.number().min(-90).max(90),
  location_lng: z.number().min(-180).max(180),
  scheduled_time: z.string().min(1, "Scheduled time required"),
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
}

const Groups = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const inviteCode = searchParams.get("invite");
    if (inviteCode && user) {
      handleJoinViaInvite(inviteCode);
    }
  }, [searchParams, user]);

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

      const formattedGroups = (data || []).map((group: any) => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0,
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

    const result = groupSchema.safeParse(formData);
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
      });
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
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="location_name">Location *</Label>
                  <Input
                    id="location_name"
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    placeholder="Central Park, NYC"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location_lat">Latitude *</Label>
                    <Input
                      id="location_lat"
                      type="number"
                      step="any"
                      value={formData.location_lat}
                      onChange={(e) => setFormData({ ...formData, location_lat: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location_lng">Longitude *</Label>
                    <Input
                      id="location_lng"
                      type="number"
                      step="any"
                      value={formData.location_lng}
                      onChange={(e) => setFormData({ ...formData, location_lng: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="scheduled_time">Scheduled Time *</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    required
                  />
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
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading events...</div>
        ) : groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 space-y-4">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">No events found</p>
                <p className="text-sm text-muted-foreground">Create your first event to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Groups;
