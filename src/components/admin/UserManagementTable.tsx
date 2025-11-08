import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Crown, Zap, User, Edit } from "lucide-react";
import SubscriptionManager from "./SubscriptionManager";

interface UserProfile {
  id: string;
  full_name: string;
  subscription_tier: string;
  subscription_status: string | null;
  subscription_end: string | null;
  created_at: string;
}

interface UserManagementTableProps {
  filterBySubscription?: boolean;
}

const UserManagementTable = ({ filterBySubscription = false }: UserManagementTableProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterBySubscription]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, subscription_tier, subscription_status, subscription_end, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filterBySubscription) {
      filtered = filtered.filter(u => u.subscription_tier !== 'free');
    }

    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'elite':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Elite
          </Badge>
        );
      case 'premium':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
            <Zap className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <User className="h-3 w-3 mr-1" />
            Free
          </Badge>
        );
    }
  };

  const handleEditSubscription = (user: UserProfile) => {
    setSelectedUser(user);
    setShowSubscriptionManager(true);
  };

  const handleSubscriptionUpdate = () => {
    setShowSubscriptionManager(false);
    setSelectedUser(null);
    loadUsers();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading users...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {filterBySubscription ? "Subscription Management" : "User Management"}
          </CardTitle>
          <CardDescription>
            {filterBySubscription
              ? "View and manage all paid subscriptions"
              : `Manage all users and their accounts (${filteredUsers.length} users)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription End</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{getTierBadge(user.subscription_tier)}</TableCell>
                      <TableCell>
                        {user.subscription_status ? (
                          <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                            {user.subscription_status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.subscription_end
                          ? new Date(user.subscription_end).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditSubscription(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {showSubscriptionManager && selectedUser && (
        <SubscriptionManager
          user={selectedUser}
          open={showSubscriptionManager}
          onClose={() => setShowSubscriptionManager(false)}
          onUpdate={handleSubscriptionUpdate}
        />
      )}
    </>
  );
};

export default UserManagementTable;
