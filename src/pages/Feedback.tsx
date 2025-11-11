import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare, Star, ThumbsUp, Bug, Lightbulb } from "lucide-react";
import Footer from "@/components/Footer";

const feedbackTypes = [
  { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-blue-500" },
  { value: "bug", label: "Bug Report", icon: Bug, color: "text-red-500" },
  { value: "improvement", label: "Improvement", icon: ThumbsUp, color: "text-green-500" },
  { value: "general", label: "General Feedback", icon: MessageSquare, color: "text-purple-500" },
];

const Feedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("general");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const title = formData.get("title") as string;
    const feedback = formData.get("feedback") as string;
    const type = formData.get("type") as string;

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Thank you for your feedback!",
      description: "Your input helps us improve Fit Connect24.",
    });

    setIsLoading(false);
    e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="mb-8"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">We Value Your Feedback</h1>
              <p className="text-xl text-muted-foreground">
                Help us make Fit Connect24 better for everyone
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Share Your Thoughts</CardTitle>
                <CardDescription>
                  Whether it's a bug, feature request, or just a suggestion - we want to hear from you!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <Label>Feedback Type</Label>
                    <RadioGroup 
                      name="type" 
                      value={selectedType} 
                      onValueChange={setSelectedType}
                      className="grid grid-cols-2 gap-4"
                    >
                      {feedbackTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <div key={type.value}>
                            <RadioGroupItem
                              value={type.value}
                              id={type.value}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={type.value}
                              className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                            >
                              <Icon className={`h-6 w-6 mb-2 ${type.color}`} />
                              <span className="text-sm font-medium">{type.label}</span>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide your email if you'd like us to follow up
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Brief summary of your feedback"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Your Feedback</Label>
                    <Textarea
                      id="feedback"
                      name="feedback"
                      placeholder="Tell us more about your experience, suggestions, or issues..."
                      rows={8}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>
                You can also email us directly at{" "}
                <a 
                  href="mailto:sales@fitconnect24.com" 
                  className="text-primary hover:underline"
                >
                  sales@fitconnect24.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Feedback;
