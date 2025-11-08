import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Zap, Crown } from "lucide-react";

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  feature: "messaging" | "events" | "filters" | "tracking";
  currentUsage?: number;
  limit?: number;
}

const UpgradePrompt = ({
  open,
  onOpenChange,
  title,
  description,
  feature,
  currentUsage,
  limit,
}: UpgradePromptProps) => {
  const navigate = useNavigate();

  const featureDetails = {
    messaging: {
      freeLimit: "5 messages per day",
      premiumFeature: "Unlimited messaging",
      icon: Zap,
    },
    events: {
      freeLimit: "2 events per month",
      premiumFeature: "Unlimited event creation",
      icon: Zap,
    },
    filters: {
      freeLimit: "Basic filters only",
      premiumFeature: "Advanced filters & AI suggestions",
      icon: Crown,
    },
    tracking: {
      freeLimit: "Basic stats",
      premiumFeature: "Detailed progress tracking & analytics",
      icon: Crown,
    },
  };

  const details = featureDetails[feature];
  const Icon = details.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        {currentUsage !== undefined && limit !== undefined && (
          <div className="py-4">
            <div className="text-center mb-2">
              <span className="text-2xl font-bold text-primary">
                {currentUsage}
              </span>
              <span className="text-muted-foreground"> / {limit}</span>
            </div>
            <div className="text-sm text-center text-muted-foreground">
              {details.freeLimit} (Free Plan)
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm">Upgrade to Premium for:</h4>
          <ul className="space-y-1 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>{details.premiumFeature}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>AI match suggestions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Priority support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Profile boosts</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              navigate("/pricing");
            }}
            className="w-full sm:w-auto"
          >
            <Zap className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePrompt;
