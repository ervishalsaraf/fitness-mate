import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown, Zap, Calendar, MessageSquare, TrendingUp } from "lucide-react";

interface Stats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  eliteUsers: number;
  totalGroups: number;
  totalMessages: number;
}

const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    freeUsers: 0,
    premiumUsers: 0,
    eliteUsers: 0,
    totalGroups: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Get total users and subscription breakdown
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("subscription_tier");

      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;
      const freeUsers = profiles?.filter(p => p.subscription_tier === 'free').length || 0;
      const premiumUsers = profiles?.filter(p => p.subscription_tier === 'premium').length || 0;
      const eliteUsers = profiles?.filter(p => p.subscription_tier === 'elite').length || 0;

      // Get total groups
      const { count: groupsCount, error: groupsError } = await supabase
        .from("groups")
        .select("*", { count: 'exact', head: true });

      if (groupsError) throw groupsError;

      // Get total messages
      const { count: messagesCount, error: messagesError } = await supabase
        .from("messages")
        .select("*", { count: 'exact', head: true });

      if (messagesError) throw messagesError;

      setStats({
        totalUsers,
        freeUsers,
        premiumUsers,
        eliteUsers,
        totalGroups: groupsCount || 0,
        totalMessages: messagesCount || 0,
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Free Tier",
      value: stats.freeUsers,
      icon: Users,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "Premium Users",
      value: stats.premiumUsers,
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Elite Users",
      value: stats.eliteUsers,
      icon: Crown,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Total Events",
      value: stats.totalGroups,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Messages",
      value: stats.totalMessages,
      icon: MessageSquare,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
        <p className="text-muted-foreground">
          Real-time statistics and metrics for your platform
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  Active users
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminStats;
