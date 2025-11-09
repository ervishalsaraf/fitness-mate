import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Star, User, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserRole {
  id: string;
  role: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface RoleManagementTableProps {
  filterByRole?: string;
}

const RoleManagementTable = ({ filterByRole }: RoleManagementTableProps) => {
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadUserRoles();
  }, []);

  useEffect(() => {
    filterRoles();
  }, [userRoles, searchQuery, filterByRole]);

  const loadUserRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          role,
          created_at,
          profiles:user_id (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error("Error loading user roles:", error);
      toast({
        title: "Error",
        description: "Failed to load user roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRoles = () => {
    let filtered = userRoles;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((userRole) => {
        const profile = userRole.profiles;
        return (
          profile?.full_name?.toLowerCase().includes(query) ||
          profile?.email?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by role
    if (filterByRole) {
      filtered = filtered.filter((userRole) => userRole.role === filterByRole);
    }

    setFilteredRoles(filtered);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case "moderator":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Star className="h-3 w-3 mr-1" />
            Moderator
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="h-3 w-3 mr-1" />
            User
          </Badge>
        );
    }
  };

  const handleRoleChange = async (userRoleId: string, userId: string, newRole: string) => {
    try {
      // Delete the old role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", userRoleId);

      if (deleteError) throw deleteError;

      // Insert the new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      loadUserRoles();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading roles...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
        <CardDescription>
          Manage user roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((userRole) => (
                  <TableRow key={userRole.id}>
                    <TableCell className="font-medium">
                      {userRole.profiles?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>{userRole.profiles?.email || "N/A"}</TableCell>
                    <TableCell>{getRoleBadge(userRole.role)}</TableCell>
                    <TableCell>
                      {new Date(userRole.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userRole.role}
                        onValueChange={(newRole) =>
                          handleRoleChange(userRole.id, userRole.profiles?.id || "", newRole)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredRoles.length} of {userRoles.length} users
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleManagementTable;
