import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Users,
  Search,
  Shield,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchAllUsers, 
  fetchAllUnits, 
  updateUserRole, 
  assignTenantToUnit,
  type UserWithDetails,
  type UnitOption,
  type UserRole
} from "@/services/admin-service";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (role === 'admin') {
      loadData();
    }
  }, [role]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, unitsData] = await Promise.all([
        fetchAllUsers(),
        fetchAllUnits(),
      ]);
      setUsers(usersData);
      setUnits(unitsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      
      const matchesRole = 
        roleFilter === "all" || 
        (roleFilter === "none" && !user.role) ||
        user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success("Role updated successfully");
      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUnitChange = async (userId: string, unitId: string) => {
    setUpdatingUserId(userId);
    try {
      const actualUnitId = unitId === "none" ? null : unitId;
      await assignTenantToUnit(userId, actualUnitId);
      toast.success(actualUnitId ? "Tenant assigned to unit" : "Tenant removed from unit");
      // Reload data to get updated assignments
      await loadData();
    } catch (error) {
      console.error("Error assigning unit:", error);
      toast.error("Failed to assign unit");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadgeColor = (userRole: UserRole | null) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500 text-white',
      maintenance: 'bg-purple-500 text-white',
      tenant: 'bg-green-500 text-white',
    };
    return userRole ? colors[userRole] || 'bg-gray-500 text-white' : 'bg-gray-300 text-gray-700';
  };

  // Access control
  if (role !== 'admin') {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-500 mb-4">Only administrators can access this page.</p>
            <Button onClick={() => navigate('/work-orders')}>Go to Work Orders</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-navy-800 py-8">
        <div className="container mx-auto px-4">
          <Heading className="text-white text-center">User Management</Heading>
          <p className="text-center text-gray-300 mt-2">Manage users, roles, and unit assignments</p>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users ({users.length})
            </CardTitle>
            <CardDescription>
              Search, filter, and manage user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="none">No Role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {users.length === 0 ? "No users found" : "No users match your search"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Unit Assignment</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || '-'}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role || "none"}
                            onValueChange={(value) => handleRoleChange(user.user_id, value as UserRole)}
                            disabled={updatingUserId === user.user_id}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue>
                                <Badge className={getRoleBadgeColor(user.role)}>
                                  {user.role || 'No Role'}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tenant">Tenant</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.unit_id || "none"}
                            onValueChange={(value) => handleUnitChange(user.user_id, value)}
                            disabled={updatingUserId === user.user_id}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select unit">
                                {user.unit_number || 'Not Assigned'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Not Assigned</SelectItem>
                              {units.map((unit) => (
                                <SelectItem 
                                  key={unit.id} 
                                  value={unit.id}
                                  disabled={unit.tenant_id !== null && unit.tenant_id !== user.user_id}
                                >
                                  {unit.unit_number}
                                  {unit.tenant_id && unit.tenant_id !== user.user_id && ' (Occupied)'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminUsers;
