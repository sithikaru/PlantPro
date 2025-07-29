'use client';

import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { dashboardApi, DashboardSummary } from '../../services/dashboard';
import { plantLotsApi, plantSpeciesApi } from '../../lib/api';
import { PlantLot, PlantSpecies } from '../../lib/types';
import AppLayout from '../../components/AppLayout';
import { TrendingUp, Users, MapPin, BarChart3, Plus, QrCode, FileText, Activity, Calendar, User, Truck, Package, Target } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Delivery analysis state
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<string>('');
  const [deliveryAnalysis, setDeliveryAnalysis] = useState<{
    plantLots: PlantLot[];
    speciesBreakdown: Array<{
      species: PlantSpecies;
      readyLots: PlantLot[];
      totalPlants: number;
      totalYield: number;
    }>;
    totalReadyPlants: number;
    totalEstimatedYield: number;
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

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
          
          // Set default delivery date to 30 days from now
          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() + 30);
          setSelectedDeliveryDate(defaultDate.toISOString().split('T')[0]);
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        } finally {
          setDataLoading(false);
        }
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user]);

  const analyzeDeliveryReadiness = async (targetDate: string) => {
    if (!targetDate) return;
    
    try {
      setAnalysisLoading(true);
      
      // Fetch all plant lots and species
      const [plantLotsResponse, speciesData] = await Promise.all([
        plantLotsApi.getAll({ limit: 1000 }), // Get all lots
        plantSpeciesApi.getAll()
      ]);
      
      const allPlantLots = plantLotsResponse.data;
      const targetDateTime = new Date(targetDate).getTime();
      
      // Filter lots that will be ready by target date
      const readyLots = allPlantLots.filter(lot => {
        if (!lot.expectedHarvestDate) return false;
        const harvestDate = new Date(lot.expectedHarvestDate).getTime();
        return harvestDate <= targetDateTime && lot.status !== 'harvested' && lot.status !== 'dead';
      });
      
      // Group by species and calculate totals
      const speciesMap = new Map<number, {
        species: PlantSpecies;
        readyLots: PlantLot[];
        totalPlants: number;
        totalYield: number;
      }>();
      
      readyLots.forEach(lot => {
        if (!lot.species) return;
        
        const existing = speciesMap.get(lot.species.id);
        const estimatedYield = lot.plantCount * (lot.species.expectedYieldPerPlant || 0);
        
        if (existing) {
          existing.readyLots.push(lot);
          existing.totalPlants += lot.plantCount;
          existing.totalYield += estimatedYield;
        } else {
          speciesMap.set(lot.species.id, {
            species: lot.species,
            readyLots: [lot],
            totalPlants: lot.plantCount,
            totalYield: estimatedYield
          });
        }
      });
      
      const speciesBreakdown = Array.from(speciesMap.values());
      const totalReadyPlants = readyLots.reduce((sum, lot) => sum + lot.plantCount, 0);
      const totalEstimatedYield = speciesBreakdown.reduce((sum, item) => sum + item.totalYield, 0);
      
      setDeliveryAnalysis({
        plantLots: readyLots,
        speciesBreakdown,
        totalReadyPlants,
        totalEstimatedYield
      });
      
    } catch (error) {
      console.error('Failed to analyze delivery readiness:', error);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Analyze delivery when date changes
  useEffect(() => {
    if (selectedDeliveryDate && isAuthenticated) {
      analyzeDeliveryReadiness(selectedDeliveryDate);
    }
  }, [selectedDeliveryDate, isAuthenticated]);

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
    <AppLayout>
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
                      <Activity className="h-6 w-6 text-green-600" />
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

          {/* Delivery Analysis Section */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Delivery Analysis</CardTitle>
                    <p className="text-gray-600 mt-1">Analyze harvest readiness for target delivery date</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="delivery-date" className="text-sm font-medium text-gray-700">
                      Target Date:
                    </label>
                    <input
                      id="delivery-date"
                      type="date"
                      value={selectedDeliveryDate}
                      onChange={(e) => setSelectedDeliveryDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="ml-3 text-gray-600">Analyzing delivery readiness...</p>
                </div>
              ) : deliveryAnalysis ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                      <div className="flex items-center space-x-3">
                        <Package className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-700">Ready Plant Lots</p>
                          <p className="text-2xl font-bold text-green-900">{deliveryAnalysis.plantLots.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-700">Total Plants</p>
                          <p className="text-2xl font-bold text-blue-900">{deliveryAnalysis.totalReadyPlants.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200">
                      <div className="flex items-center space-x-3">
                        <Target className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-700">Est. Yield</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {deliveryAnalysis.totalEstimatedYield.toLocaleString()}
                            <span className="text-sm font-normal ml-1">units</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Species Breakdown */}
                  {deliveryAnalysis.speciesBreakdown.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Species Breakdown</h3>
                      <div className="space-y-3">
                        {deliveryAnalysis.speciesBreakdown.map((item) => (
                          <div key={item.species.id} className="bg-gray-50 p-4 rounded-2xl">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{item.species.name}</h4>
                                <p className="text-sm text-gray-600 italic">{item.species.scientificName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  {item.readyLots.length} lot{item.readyLots.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                              <div className="text-center p-3 bg-white rounded-xl">
                                <p className="text-sm text-gray-600">Plants</p>
                                <p className="text-xl font-bold text-gray-900">{item.totalPlants.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-3 bg-white rounded-xl">
                                <p className="text-sm text-gray-600">Est. Yield</p>
                                <p className="text-xl font-bold text-gray-900">
                                  {item.totalYield.toLocaleString()}
                                  <span className="text-sm font-normal ml-1">{item.species.yieldUnit || 'units'}</span>
                                </p>
                              </div>
                              <div className="text-center p-3 bg-white rounded-xl">
                                <p className="text-sm text-gray-600">Yield/Plant</p>
                                <p className="text-xl font-bold text-gray-900">
                                  {item.species.expectedYieldPerPlant?.toFixed(1) || '0'}
                                  <span className="text-sm font-normal ml-1">{item.species.yieldUnit || 'units'}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No plants ready for delivery by this date</p>
                      <p className="text-sm text-gray-400 mt-1">Try selecting a later date</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Select a delivery date to analyze</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button asChild className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/plant-lots">
                    <Activity className="mr-3 h-5 w-5" />
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
    </AppLayout>
  );
}
