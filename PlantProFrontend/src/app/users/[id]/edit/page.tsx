'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { usersApi } from '../../../../lib/api';
import { User, UpdateUserData } from '../../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import AppLayout from '../../../../components/AppLayout';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Shield, 
  UserCog, 
  Activity, 
  Save 
} from 'lucide-react';
import Link from 'next/link';

interface EditUserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [formData, setFormData] = useState<UpdateUserData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'field_staff',
    phoneNumber: '',
  });

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setResolvedParams(resolved);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated || currentUser?.role !== 'manager') {
      router.push('/dashboard');
      return;
    }
    
    if (resolvedParams?.id) {
      fetchUser();
    }
  }, [isAuthenticated, currentUser, resolvedParams, router]);

  const fetchUser = async () => {
    if (!resolvedParams?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getById(parseInt(resolvedParams.id));
      setUser(response);
      setFormData({
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
        phoneNumber: response.phoneNumber || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      
      const updateData: UpdateUserData = {
        ...formData,
        phoneNumber: formData.phoneNumber || undefined,
      };

      await usersApi.update(user.id, updateData);
      router.push(`/users/${user.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UpdateUserData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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
                <p className="mt-4 text-green-600 font-medium">Loading user...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error && !user) {
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
                  {error}
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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href={`/users/${resolvedParams?.id}`}>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to User Details
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Edit User
            </h1>
            <p className="text-gray-600 mt-1">
              Update user information and permissions
            </p>
          </div>

          {/* Form */}
          <Card className="shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                User Information
              </CardTitle>
              <CardDescription>
                Update the user&apos;s details and role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {error}
                  </div>
                )}

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="mt-1 rounded-xl"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="mt-1 rounded-xl"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1 rounded-xl"
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="mt-1 rounded-xl"
                      placeholder="Enter phone number (optional)"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <Label htmlFor="role" className="text-sm font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role *
                  </Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleInputChange('role', value)}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(formData.role || '')}
                          <span className="capitalize">{formData.role?.replace('_', ' ')}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="field_staff">
                        <div className="flex items-center gap-2">
                          <UserCog className="w-4 h-4 text-green-600" />
                          Field Staff
                        </div>
                      </SelectItem>
                      <SelectItem value="analytics">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600" />
                          Analytics
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the appropriate role for this user&apos;s responsibilities
                  </p>
                </div>

                {/* Role Description */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    {getRoleIcon(formData.role || '')}
                    {formData.role === 'manager' && 'Manager Role'}
                    {formData.role === 'field_staff' && 'Field Staff Role'}
                    {formData.role === 'analytics' && 'Analytics Role'}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {formData.role === 'manager' && 
                      'Full access to all system features including user management, plant lot management, and analytics dashboard.'
                    }
                    {formData.role === 'field_staff' && 
                      'Access to assigned plant lots, QR code scanning, health logging, and field operations.'
                    }
                    {formData.role === 'analytics' && 
                      'Read-only access to analytics dashboard, reports, and data visualization features.'
                    }
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Link href={`/users/${resolvedParams?.id}`} className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1 rounded-xl"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update User
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
