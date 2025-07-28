'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import AppLayout from '../../components/AppLayout';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Users as UsersIcon, 
  UserCheck, 
  UserX, 
  Shield,
  Activity,
  MoreVertical,
  Eye,
  Key,
  UserCog
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'manager' | 'field_staff' | 'analytics';
  phoneNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedPlantLotsCount?: number;
  healthLogsCount?: number;
}

interface UserStats {
  total: number;
  byRole: {
    manager: number;
    field_staff: number;
    analytics: number;
  };
  active: number;
  inactive: number;
}

export default function UsersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'manager')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'manager') {
      fetchUsers();
      fetchStats();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getAll();
      setUsers(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await usersApi.getStats();
      setStats(response);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await usersApi.toggleStatus(userId);
      await fetchUsers();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await usersApi.deleteUser(userId);
      await fetchUsers();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'field_staff': return 'bg-green-100 text-green-800 border-green-200';
      case 'analytics': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager': return <Shield className="w-3 h-3" />;
      case 'field_staff': return <UserCog className="w-3 h-3" />;
      case 'analytics': return <Activity className="w-3 h-3" />;
      default: return <UsersIcon className="w-3 h-3" />;
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-96 shadow-xl rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-green-600 font-medium">Loading users...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated || user?.role !== 'manager') {
    return null;
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  User Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage system users and their permissions
                </p>
              </div>
              <Link href="/users/new">
                <Button className="rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="shadow-lg rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <UsersIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-3xl font-bold text-green-900">{stats.active}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Managers</p>
                      <p className="text-3xl font-bold text-purple-900">{stats.byRole.manager}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg rounded-3xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Field Staff</p>
                      <p className="text-3xl font-bold text-green-900">{stats.byRole.field_staff}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-xl">
                      <UserCog className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card className="shadow-xl rounded-3xl mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-48 rounded-xl">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="field_staff">Field Staff</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 rounded-xl">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="shadow-xl rounded-3xl mb-6 border-red-200">
              <CardContent className="p-6">
                <div className="text-red-600 text-center">
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Table */}
          <Card className="shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Users ({filteredUsers.length})</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredUsers.map((userData) => (
                  <div
                    key={userData.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {userData.firstName} {userData.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{userData.email}</p>
                        {userData.phoneNumber && (
                          <p className="text-xs text-gray-500">{userData.phoneNumber}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="outline" 
                        className={`px-3 py-1 rounded-xl border ${getRoleBadgeColor(userData.role)}`}
                      >
                        {getRoleIcon(userData.role)}
                        <span className="ml-1 capitalize">{userData.role.replace('_', ' ')}</span>
                      </Badge>

                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {userData.assignedPlantLotsCount || 0}
                        </p>
                        <p className="text-xs text-gray-500">Plant Lots</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          {userData.healthLogsCount || 0}
                        </p>
                        <p className="text-xs text-gray-500">Health Logs</p>
                      </div>

                      <Badge 
                        variant={userData.isActive ? "default" : "secondary"}
                        className={`rounded-xl ${
                          userData.isActive 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {userData.isActive ? (
                          <>
                            <UserCheck className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <UserX className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="rounded-full">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${userData.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${userData.id}/edit`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/users/${userData.id}/change-password`}>
                              <Key className="w-4 h-4 mr-2" />
                              Change Password
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(userData.id)}
                            className="text-orange-600"
                          >
                            {userData.isActive ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e: Event) => e.preventDefault()}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account for {userData.firstName} {userData.lastName}.
                                  {(userData.assignedPlantLotsCount || 0) > 0 && (
                                    <span className="block mt-2 text-red-600 font-medium">
                                      Warning: This user has {userData.assignedPlantLotsCount} assigned plant lots.
                                    </span>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(userData.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Get started by creating your first user'}
                    </p>
                    {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
                      <Link href="/users/new">
                        <Button className="rounded-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          Add First User
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
