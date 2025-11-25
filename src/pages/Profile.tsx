import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy, Share2, Users, Globe, Lock, Crown, Zap, User as UserIcon, Calendar as CalendarIcon } from "lucide-react";
import { LocationManager } from "@/components/LocationManager";
import { SavedLocations } from "@/components/SavedLocations";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    completedReferrals: 0,
  });
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    age: "",
    gender: "",
    skill_level: "",
    bio: "",
    is_public: false,
  });

  useEffect(() => {
    loadProfile();
    loadReferralData();
    loadSubscriptionData();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          age: profileData.age?.toString() || "",
          gender: (profileData.gender as any) || "",
          skill_level: (profileData.skill_level as any) || "",
          bio: profileData.bio || "",
          is_public: profileData.is_public || false,
        });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('generate_referral_code');
      
      if (error) throw error;

      await supabase
        .from("profiles")
        .update({ referral_code: data })
        .eq("id", user.id);

      return data;
    } catch (error) {
      console.error("Error generating referral code:", error);
      return null;
    }
  };

  const loadReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .single();

      if (profileData?.referral_code) {
        setReferralCode(profileData.referral_code);
      } else {
        const newCode = await generateReferralCode();
        if (newCode) setReferralCode(newCode);
      }

      const { data: referrals } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id);

      setReferralStats({
        totalReferrals: referrals?.length || 0,
        completedReferrals: referrals?.filter(r => r.status === "completed").length || 0,
      });
    } catch (error) {
      console.error("Error loading referral data:", error);
    }
  };

  const loadSubscriptionData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!error && data) {
        setSubscriptionTier(data.tier || 'free');
        setSubscriptionEnd(data.subscription_end);
        setSubscriptionStatus(data.subscription_status);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          age: profile.age ? parseInt(profile.age) : null,
          gender: profile.gender || null as any,
          skill_level: profile.skill_level || null as any,
          bio: profile.bio,
          is_public: profile.is_public,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getReferralLink = () => {
    return `${window.location.origin}/auth?ref=${referralCode}`;
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    await navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareViaWhatsApp = () => {
    const message = `Join me on Fit Connect24! Let's work out together 💪 ${getReferralLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = "Join me on Fit Connect24!";
    const body = `Hey! I'm using Fit Connect24 to find fitness buddies and track my activities. Join me using this link: ${getReferralLink()}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaSMS = () => {
    const message = `Join me on Fit Connect24! ${getReferralLink()}`;
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  const shareViaWeb = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Fit Connect24",
          text: "Join me on Fit Connect24! Let's work out together 💪",
          url: getReferralLink(),
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <SavedLocations />
        <LocationManager />
        
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_level">Skill Level</Label>
              <Select value={profile.skill_level} onValueChange={(value) => setProfile({ ...profile, skill_level: value })}>
                <SelectTrigger id="skill_level">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                {profile.is_public ? (
                  <Globe className="h-5 w-5 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="is_public" className="cursor-pointer">
                    Make Profile Public
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anyone to find you in search results
                  </p>
                </div>
              </div>
              <Switch
                id="is_public"
                checked={profile.is_public}
                onCheckedChange={(checked) => setProfile({ ...profile, is_public: checked })}
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Current Subscription Plan */}
        <Card className={subscriptionTier === 'elite' ? 'border-amber-500/20 bg-gradient-to-br from-amber-50 to-amber-100/20' : subscriptionTier === 'premium' ? 'border-purple-500/20 bg-gradient-to-br from-purple-50 to-purple-100/20' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {subscriptionTier === 'elite' && <Crown className="h-5 w-5 text-amber-600" />}
                {subscriptionTier === 'premium' && <Zap className="h-5 w-5 text-purple-600" />}
                {subscriptionTier === 'free' && <UserIcon className="h-5 w-5" />}
                Current Plan
              </CardTitle>
              <Badge 
                variant={subscriptionTier === 'elite' ? 'default' : subscriptionTier === 'premium' ? 'secondary' : 'outline'}
                className={subscriptionTier === 'elite' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' : subscriptionTier === 'premium' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white' : ''}
              >
                {subscriptionTier.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionEnd && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>Expires: {new Date(subscriptionEnd).toLocaleDateString()}</span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Your Benefits:</p>
              {subscriptionTier === 'free' && (
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 5 messages per day</li>
                  <li>• 2 events per month</li>
                  <li>• Basic filters</li>
                </ul>
              )}
              {subscriptionTier === 'premium' && (
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unlimited messages & events</li>
                  <li>• Advanced filters</li>
                  <li>• AI buddy suggestions</li>
                  <li>• Priority support</li>
                </ul>
              )}
              {subscriptionTier === 'elite' && (
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All Premium features</li>
                  <li>• Exclusive badges</li>
                  <li>• VIP support</li>
                  <li>• Early access to features</li>
                </ul>
              )}
            </div>

            <Button
              className="w-full"
              variant={subscriptionTier === 'free' ? 'default' : 'outline'}
              onClick={() => navigate(subscriptionTier === 'free' ? '/pricing' : '/subscription')}
            >
              {subscriptionTier === 'free' ? (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </>
              ) : (
                'Manage Subscription'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Invite Friends Section */}
        <Card className="border-2 border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Invite Friends</CardTitle>
            </div>
            <CardDescription>
              Share Fit Connect24 with friends and grow your fitness community
              {referralStats.totalReferrals > 0 && ` · ${referralStats.totalReferrals} friend${referralStats.totalReferrals > 1 ? 's' : ''} invited`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your Referral Link</Label>
              <div className="flex gap-2">
                <Input
                  value={referralCode ? getReferralLink() : "Loading..."}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={copyReferralLink} size="icon" variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={shareViaWhatsApp} variant="outline" className="w-full">
                WhatsApp
              </Button>
              <Button onClick={shareViaEmail} variant="outline" className="w-full">
                Email
              </Button>
              <Button onClick={shareViaSMS} variant="outline" className="w-full">
                SMS
              </Button>
              <Button onClick={shareViaWeb} variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Friends Invited</span>
                <span className="text-2xl font-bold text-primary">{referralStats.totalReferrals}</span>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  💡 <span className="font-semibold">Tip:</span> You can also invite friends directly to specific events!
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/groups')} 
                  className="w-full"
                >
                  View Events & Invite Friends
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
