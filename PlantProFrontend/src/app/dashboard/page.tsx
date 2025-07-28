'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { dashboardApi, DashboardSummary } from '../../services/dashboard';
import { TrendingUp, Users, MapPin, BarChart3, Plus, QrCode, FileText, Leaf, Activity, Calendar, User } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isAuthenticated && user) {
        try {
          setDataLoading(true);
          const data = await dashboardApi.getDashboardSummary();
          setDashboardData(data);
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        } finally {
          setDataLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96 border-0 shadow-xl rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
              <p className="mt-6 text-gray-600 font-medium">Loading your dashboard...</p>
            </div>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-gray-900 font-['Inter'] tracking-tight">PlantPro Dashboard</h1>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="text-sm font-medium text-green-600">Analytics</div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <Badge className={`${getRoleColor(user.role)} rounded-full px-3 py-1 font-medium`}>
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="rounded-full border-2 hover:bg-red-50 hover:border-red-200"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block">
        <div className="flex flex-col space-y-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <BarChart3 className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-green-50 w-12 h-12">
            <Leaf className="h-5 w-5 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <Users className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <Activity className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-12 px-6 lg:px-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-3 font-['Inter'] tracking-tight">
              Plant Management Overview
            </h2>
            <p className="text-xl text-gray-600 font-light leading-relaxed">
              Monitor and manage your plantation with real-time insights
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                      <Leaf className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-6 flex-1">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Active Plant Lots
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {dataLoading ? 'Loading...' : dashboardData?.totalPlantLots || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-6 flex-1">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Active Zones
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {dataLoading ? 'Loading...' : dashboardData?.totalActiveZones || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="ml-6 flex-1">
                    <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Ready for Harvest
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {dataLoading ? 'Loading...' : dashboardData?.readyForHarvest || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/plant-lots">
                    <Leaf className="mr-3 h-5 w-5" />
                    View Plant Lots
                  </Link>
                </Button>
                {(user.role === 'manager' || user.role === 'field_staff') && (
                  <>
                    <Button asChild variant="outline" className="h-14 rounded-2xl border-2 font-medium hover:bg-gray-50 transition-all duration-300">
                      <Link href="/plant-lots/create">
                        <Plus className="mr-3 h-5 w-5" />
                        Create Plant Lot
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 rounded-2xl border-2 font-medium hover:bg-blue-50 hover:border-blue-200 transition-all duration-300">
                      <Link href="/qr-scanner">
                        <QrCode className="mr-3 h-5 w-5" />
                        QR Scanner
                      </Link>
                    </Button>
                  </>
                )}
                {user.role === 'analytics' && (
                  <Button asChild variant="outline" className="h-14 rounded-2xl border-2 font-medium hover:bg-purple-50 hover:border-purple-200 transition-all duration-300">
                    <Link href="/reports">
                      <FileText className="mr-3 h-5 w-5" />
                      View Reports
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">Activity feed will be displayed here</p>
                <p className="text-sm text-gray-400">Coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
