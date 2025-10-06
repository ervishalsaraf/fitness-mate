import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bike, Dumbbell, PersonStanding, Waves, Mountain, Heart, Users } from "lucide-react";

const activities = [
  { value: "jogging", label: "Jogging", icon: PersonStanding },
  { value: "yoga", label: "Yoga", icon: Heart },
  { value: "cycling", label: "Cycling", icon: Bike },
  { value: "swimming", label: "Swimming", icon: Waves },
  { value: "trekking", label: "Trekking", icon: Mountain },
  { value: "walking", label: "Walking", icon: PersonStanding },
  { value: "gym", label: "Gym", icon: Dumbbell },
];

const timeSlots = [
  { value: "morning", label: "Morning", time: "6 AM - 12 PM" },
  { value: "afternoon", label: "Afternoon", time: "12 PM - 6 PM" },
  { value: "evening", label: "Evening", time: "6 PM - 12 AM" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleActivity = (activity: string) => {
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const toggleTime = (time: string) => {
    setSelectedTimes(prev =>
      prev.includes(time)
        ? prev.filter(t => t !== time)
        : [...prev, time]
    );
  };

  const handleFinish = async () => {
    if (selectedActivities.length === 0 || selectedTimes.length === 0) {
      toast({
        title: "Selection required",
        description: "Please select at least one activity and time slot.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Insert activity preferences
    const activityPromises = selectedActivities.map(activity =>
      supabase.from("activity_preferences").insert({
        user_id: user.id,
        activity_type: activity as any,
      })
    );

    // Insert time preferences
    const timePromises = selectedTimes.map(time =>
      supabase.from("time_preferences").insert({
        user_id: user.id,
        time_slot: time as any,
      })
    );

    const results = await Promise.all([...activityPromises, ...timePromises]);
    const errors = results.filter(r => r.error);

    setIsSubmitting(false);

    if (errors.length > 0) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "All set!",
        description: "Let's find your activity buddies!",
      });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome! Let's get you started</CardTitle>
          <CardDescription>
            Tell us about your fitness interests (Step {step} of 2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg mb-4 block">What activities do you enjoy?</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activities.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => toggleActivity(value)}
                      className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                        selectedActivities.includes(value)
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Icon className={`h-8 w-8 ${selectedActivities.includes(value) ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full" disabled={selectedActivities.length === 0}>
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg mb-4 block">When do you prefer to be active?</Label>
                <div className="grid gap-3">
                  {timeSlots.map(({ value, label, time }) => (
                    <button
                      key={value}
                      onClick={() => toggleTime(value)}
                      className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                        selectedTimes.includes(value)
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-semibold">{label}</div>
                        <div className="text-sm text-muted-foreground">{time}</div>
                      </div>
                      <Users className={`h-6 w-6 ${selectedTimes.includes(value) ? "text-primary" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleFinish} 
                  className="flex-1" 
                  disabled={selectedTimes.length === 0 || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Get Started"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
