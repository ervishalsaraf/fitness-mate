import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Crown, Zap, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  full_name: string;
  subscription_tier: string;
  subscription_end: string | null;
}

interface SubscriptionManagerProps {
  user: UserProfile;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const SubscriptionManager = ({ user, open, onClose, onUpdate }: SubscriptionManagerProps) => {
  const [selectedTier, setSelectedTier] = useState(user.subscription_tier);
  const [endDate, setEndDate] = useState<Date | undefined>(
    user.subscription_end ? new Date(user.subscription_end) : undefined
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        subscription_tier: selectedTier,
        subscription_status: selectedTier === 'free' ? null : 'active',
      };

      if (selectedTier !== 'free' && endDate) {
        updates.subscription_end = endDate.toISOString();
      } else {
        updates.subscription_end = null;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
          <DialogDescription>
            Update subscription tier and end date for {user.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Subscription Tier</Label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Free Tier
                  </div>
                </SelectItem>
                <SelectItem value="premium">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    Premium
                  </div>
                </SelectItem>
                <SelectItem value="elite">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-600" />
                    Elite
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedTier !== 'free' && (
            <div className="space-y-2">
              <Label>Subscription End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-medium text-sm">Tier Benefits</h4>
            {selectedTier === 'free' && (
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 5 messages per day</li>
                <li>• 2 events per month</li>
                <li>• Basic filters</li>
              </ul>
            )}
            {selectedTier === 'premium' && (
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Unlimited messages</li>
                <li>• Unlimited events</li>
                <li>• Advanced filters</li>
                <li>• AI suggestions</li>
              </ul>
            )}
            {selectedTier === 'elite' && (
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All Premium features</li>
                <li>• Priority support</li>
                <li>• Exclusive badges</li>
                <li>• Early access to features</li>
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionManager;
