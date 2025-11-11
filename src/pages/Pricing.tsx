import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowLeft } from "lucide-react";

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    popular: false,
    features: [
      { text: "5 messages per day", included: true },
      { text: "2 events per month", included: true },
      { text: "Basic profile", included: true },
      { text: "Join public events", included: true },
      { text: "Connect with buddies", included: true },
      { text: "Unlimited messaging", included: false },
      { text: "Unlimited events", included: false },
      { text: "AI match suggestions", included: false },
      { text: "Advanced filters", included: false },
      { text: "Progress tracking", included: false },
      { text: "Profile boosts", included: false },
      { text: "Verified badge", included: false },
      { text: "Business page", included: false },
      { text: "Analytics dashboard", included: false },
    ],
    cta: "Current Plan",
    priceId: null,
  },
  {
    name: "Premium",
    price: "$10",
    period: "per month",
    description: "30 days FREE for new users!",
    popular: true,
    features: [
      { text: "Everything in Free", included: true },
      { text: "Unlimited messaging", included: true },
      { text: "Unlimited event creation", included: true },
      { text: "AI match suggestions", included: true },
      { text: "Advanced filters", included: true },
      { text: "Progress tracking", included: true },
      { text: "Profile boosts", included: true },
      { text: "Priority support", included: true },
      { text: "Custom activity tracking", included: true },
      { text: "Verified badge", included: false },
      { text: "Business page", included: false },
      { text: "Paid group sessions", included: false },
      { text: "Priority map listing", included: false },
      { text: "Analytics dashboard", included: false },
    ],
    cta: "Get Premium",
    priceId: "price_1SR5DJ0coPLUaZN5MGdE7wlu",
  },
  {
    name: "Elite",
    price: "$20",
    period: "per month",
    description: "For trainers and fitness professionals",
    popular: false,
    features: [
      { text: "Everything in Premium", included: true },
      { text: "Verified trainer badge", included: true },
      { text: "Business/service page", included: true },
      { text: "Paid group sessions", included: true },
      { text: "Priority map listing", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Revenue tracking", included: true },
      { text: "Client management tools", included: true },
      { text: "Custom branding", included: true },
      { text: "Advanced scheduling", included: true },
      { text: "Marketing tools", included: true },
      { text: "Dedicated support", included: true },
    ],
    cta: "Get Elite",
    priceId: "price_1SR5Dd0coPLUaZN5ohce98be",
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  const handleGetStarted = (priceId: string | null) => {
    if (!priceId) {
      navigate("/auth");
    } else {
      navigate("/auth", { state: { priceId } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10 mb-8"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center text-white mb-12">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse">
            🎉 NEW USERS GET 30 DAYS FREE PREMIUM!
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Fitness Journey
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Start with 30 days of Premium access, then select the plan that best fits your fitness goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${
                tier.popular
                  ? "border-primary shadow-2xl scale-105"
                  : "border-border/50"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
                <CardDescription className="text-sm mb-4">
                  {tier.description}
                </CardDescription>
                <div className="space-y-1">
                  <div className="text-4xl font-bold">{tier.price}</div>
                  <div className="text-sm text-muted-foreground">
                    {tier.period}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() => handleGetStarted(tier.priceId)}
                >
                  {tier.cta}
                </Button>

                <div className="pt-4 border-t">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={
                            feature.included
                              ? "text-foreground"
                              : "text-muted-foreground/60"
                          }
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center text-white/80 max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4 text-left">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="font-medium mb-2">Can I change plans anytime?</p>
              <p className="text-sm text-white/70">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="font-medium mb-2">What payment methods do you accept?</p>
              <p className="text-sm text-white/70">
                We accept all major credit cards through our secure Stripe payment processor.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <p className="font-medium mb-2">Is there a free trial?</p>
              <p className="text-sm text-white/70">
                Yes! All new users automatically get 30 days of Premium access for FREE. Experience all premium features with no credit card required. After 30 days, you can choose to continue with Premium or switch to our Free plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
