import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PRICE_IDS = {
  premium: "price_1SR5DJ0coPLUaZN5MGdE7wlu",
  elite: "price_1SR5Dd0coPLUaZN5ohce98be"
};

const PRODUCT_IDS = {
  premium: "prod_TNqvBntIKHF4X1",
  elite: "prod_TNqv6HPOFdQMxo"
};

const Subscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscribed: boolean;
    tier: string;
    product_id: string | null;
    subscription_end: string | null;
  } | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await checkSubscription();
  };

  const checkSubscription = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setSubscriptionStatus(data);
      toast.success("Subscription status updated");
    } catch (error: any) {
      console.error("Error checking subscription:", error);
      toast.error(error.message || "Failed to check subscription");
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  const handleCheckout = async (priceId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      toast.loading("Creating checkout session...");

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Checkout session created! Opening in new tab...");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast.error(error.message || "Failed to create checkout session");
    }
  };

  const handleCustomerPortal = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      toast.loading("Opening customer portal...");

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success("Customer portal opened in new tab");
      }
    } catch (error: any) {
      console.error("Error opening portal:", error);
      toast.error(error.message || "Failed to open customer portal");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentTier = subscriptionStatus?.tier || 'free';
  const isSubscribed = subscriptionStatus?.subscribed || false;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </Button>
      </div>

      <h1 className="text-4xl font-bold mb-2">Subscription Management</h1>
      <p className="text-muted-foreground mb-8">Test the subscription flow end-to-end</p>

      {/* Current Status Card */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription Status</CardTitle>
              <CardDescription>User: {user?.email}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSubscription}
              disabled={checking}
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <span className="font-medium">
                {isSubscribed ? "Active Subscription" : "No Active Subscription"}
              </span>
            </div>
            <Badge variant={currentTier === 'free' ? 'secondary' : 'default'}>
              {currentTier.toUpperCase()} TIER
            </Badge>
          </div>

          {subscriptionStatus?.subscription_end && (
            <div className="text-sm text-muted-foreground">
              Subscription ends: {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
            </div>
          )}

          {isSubscribed && (
            <Button
              variant="outline"
              onClick={handleCustomerPortal}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Premium Plan */}
        <Card className={currentTier === 'premium' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Premium Plan
              {currentTier === 'premium' && (
                <Badge>Current Plan</Badge>
              )}
            </CardTitle>
            <CardDescription>$10/month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li>✓ Unlimited messaging</li>
              <li>✓ Unlimited event creation</li>
              <li>✓ AI match suggestions</li>
              <li>✓ Advanced filters</li>
              <li>✓ Progress tracking</li>
              <li>✓ Profile boosts</li>
            </ul>
            {currentTier !== 'premium' && (
              <Button
                className="w-full"
                onClick={() => handleCheckout(PRICE_IDS.premium)}
              >
                Subscribe to Premium
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Elite Plan */}
        <Card className={currentTier === 'elite' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Elite Plan
              {currentTier === 'elite' && (
                <Badge>Current Plan</Badge>
              )}
            </CardTitle>
            <CardDescription>$20/month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li>✓ All Premium features</li>
              <li>✓ Verified trainer badge</li>
              <li>✓ Business/service page</li>
              <li>✓ Paid group sessions</li>
              <li>✓ Priority map listing</li>
              <li>✓ Analytics dashboard</li>
            </ul>
            {currentTier !== 'elite' && (
              <Button
                className="w-full"
                onClick={() => handleCheckout(PRICE_IDS.elite)}
              >
                Subscribe to Elite
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Edge function response data</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
            {JSON.stringify(subscriptionStatus, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscription;
