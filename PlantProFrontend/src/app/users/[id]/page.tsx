'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { usersApi } from '../../../lib/api';
import { User } from '../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import AppLayout from '../../../components/AppLayout';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  Activity, 
  UserCog,
  UserCheck,
  UserX,
  Edit,
  Key,
  Trash2,
  Calendar,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
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
} from "../../../components/ui/alert-dialog";

interface UserDetailsPageProps {
  params: {
    id: string;
  };
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'manager') {
      router.push('/dashboard');
      return;
    }
    
    if (params.id) {
      fetchUser();
    }
  }, [isAuthenticated, currentUser, params.id, router]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getById(parseInt(params.id));
      setUser(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    try {
      await usersApi.toggleStatus(user.id);
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    try {
      await usersApi.deleteUser(user.id);
      router.push('/users');
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
      case 'manager': return <Shield className="w-4 h-4" />;
      case 'field_staff': return <UserCog className="w-4 h-4" />;
      case 'analytics': return <Activity className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated || currentUser?.role !== 'manager') {
    return null;
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-96 shadow-xl rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-green-600 font-medium">Loading user details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error || !user) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <Link href="/users">
                <Button variant="outline" size="sm" className="rounded-xl mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Users
                </Button>
              </Link>
            </div>
            <Card className="shadow-xl rounded-3xl border-red-200">
              <CardContent className="p-8 text-center">
                <div className="text-red-600">
                  {error || 'User not found'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/users">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Users
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    User Details
                  </h1>
                  <p className="text-gray-600 mt-1">
                    View and manage user information
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/users/${user.id}/edit`}>
                  <Button variant="outline" className="rounded-xl">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/users/${user.id}/change-password`}>
                  <Button variant="outline" className="rounded-xl">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main User Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl rounded-3xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold">
                          {user.firstName} {user.lastName}
                        </CardTitle>
                        <CardDescription className="text-lg">
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant={user.isActive ? "default" : "secondary"}
                      className={`px-4 py-2 rounded-xl text-sm ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 mr-2" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Mail className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </div>
                      {user.phoneNumber && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <Phone className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium">{user.phoneNumber}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="font-medium">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <Activity className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Last Updated</p>
                          <p className="font-medium">
                            {new Date(user.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Role Card */}
              <Card className="shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg">Role & Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge 
                    variant="outline" 
                    className={`w-full justify-center py-3 rounded-xl border-2 ${getRoleBadgeColor(user.role)}`}
                  >
                    {getRoleIcon(user.role)}
                    <span className="ml-2 text-lg font-semibold capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  </Badge>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-900">Role Description:</p>
                    <p className="text-sm text-gray-600">
                      {user.role === 'manager' && 
                        'Full system access including user management, plant lot management, and analytics.'
                      }
                      {user.role === 'field_staff' && 
                        'Field operations access including plant lot management and health logging.'
                      }
                      {user.role === 'analytics' && 
                        'Read-only access to analytics dashboard and reporting features.'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics Card */}
              <Card className="shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg">Activity Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Plant Lots</span>
                    </div>
                    <span className="font-bold text-blue-900">
                      {user.assignedPlantLotsCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Health Logs</span>
                    </div>
                    <span className="font-bold text-green-900">
                      {user.healthLogsCount || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions Card */}
              <Card className="shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={handleToggleStatus}
                  >
                    {user.isActive ? (
                      <>
                        <UserX className="w-4 h-4 mr-2" />
                        Deactivate User
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Activate User
                      </>
                    )}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the user account for {user.firstName} {user.lastName}.
                          {(user.assignedPlantLotsCount || 0) > 0 && (
                            <span className="block mt-2 text-red-600 font-medium">
                              Warning: This user has {user.assignedPlantLotsCount} assigned plant lots.
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteUser}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
