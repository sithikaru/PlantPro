'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { usersApi } from '../../../../lib/api';
import { User, ResetPasswordData } from '../../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import AppLayout from '../../../../components/AppLayout';
import { ArrowLeft, Key, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface ResetPasswordPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      const resetPasswordData: ResetPasswordData = {
        newPassword: formData.newPassword,
      };

      await usersApi.resetPassword(user.id, resetPasswordData);
      
      setSuccess(true);
      setFormData({
        newPassword: '',
        confirmPassword: '',
      });
      
      // Redirect after success
      setTimeout(() => {
        router.push(`/users/${user.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(false);
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
              Reset Password
            </h1>
            <p className="text-gray-600 mt-1">
              Set a new password for {user?.firstName} {user?.lastName}
            </p>
          </div>

          {/* Form */}
          <Card className="shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Key className="w-5 h-5" />
                Manager Password Reset
              </CardTitle>
              <CardDescription>
                Set a new password without requiring the current password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Success Message */}
                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Password reset successfully! Redirecting...
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                    {error}
                  </div>
                )}

                {/* Manager Privilege Notice */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900 mb-1">Manager Privilege</h4>
                      <p className="text-sm text-amber-700">
                        As a manager, you can reset any user&apos;s password without knowing their current password. 
                        Use this feature responsibly and ensure the new password is communicated securely to the user.
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium">
                    New Password *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      className="pr-10 rounded-xl"
                      placeholder="Enter new password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>

                {/* Confirm New Password */}
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm New Password *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pr-10 rounded-xl"
                      placeholder="Confirm new password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Password Security Tips */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Password Security Tips
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use at least 8 characters</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include numbers and special characters</li>
                    <li>• Avoid using personal information</li>
                    <li>• Generate a secure random password</li>
                  </ul>
                </div>

                {/* Security Notice */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-2">Security Notice</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• This action will be logged for security audit purposes</li>
                    <li>• The user will need to use the new password for their next login</li>
                    <li>• Consider informing the user about the password change</li>
                    <li>• Recommend the user changes the password after first login</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Link href={`/users/${resolvedParams?.id}`} className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-xl"
                      disabled={saving || success}
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
                    disabled={saving || success || formData.newPassword !== formData.confirmPassword}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Resetting...
                      </>
                    ) : success ? (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Password Reset
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Reset Password
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
