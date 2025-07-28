'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'default';
      case 'field_staff':
        return 'secondary';
      case 'analytics':
        return 'outline';
      default:
        return 'default';
    }
  };

  const canManagePlants = user.role === 'manager' || user.role === 'field_staff';
  const canViewReports = true; // All roles can view reports

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-foreground">PlantPro Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <Badge variant={getRoleColor(user.role)}>
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button
                onClick={logout}
                variant="destructive"
                size="sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">🌱</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground truncate">
                        Active Plant Lots
                      </div>
                      <div className="text-lg font-medium text-foreground">
                        Loading...
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">📍</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground truncate">
                        Active Zones
                      </div>
                      <div className="text-lg font-medium text-foreground">
                        Loading...
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold">🌾</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground truncate">
                        Ready for Harvest
                      </div>
                      <div className="text-lg font-medium text-foreground">
                        Loading...
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild>
                  <Link href="/plant-lots">
                    View Plant Lots
                  </Link>
                </Button>
                {(user.role === 'manager' || user.role === 'field_staff') && (
                  <>
                    <Button asChild variant="secondary">
                      <Link href="/plant-lots/create">
                        Create Plant Lot
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/qr-scanner">
                        QR Scanner
                      </Link>
                    </Button>
                  </>
                )}
                {user.role === 'analytics' && (
                  <Button asChild variant="secondary">
                    <Link href="/reports">
                      View Reports
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Activity feed will be displayed here</p>
                <p className="text-sm">Coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
