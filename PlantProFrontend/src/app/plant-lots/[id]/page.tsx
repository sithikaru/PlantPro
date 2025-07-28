'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi } from '../../../lib/api';
import { PlantLot } from '../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ArrowLeft, QrCode, Download, Edit, Plus, TrendingUp, Droplets, Sun, Thermometer, Activity, Calendar, MapPin, User, Leaf, BarChart3, Play } from 'lucide-react';
import HealthLogHistory from '../../../components/health-log-history';

interface PlantLotDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function PlantLotDetailPageClient({ lotId }: { lotId: number }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plantLot, setPlantLot] = useState<PlantLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && lotId) {
      fetchPlantLot();
    }
  }, [isAuthenticated, lotId]);

  const fetchPlantLot = async () => {
    try {
      setLoading(true);
      setError(null);
      const lot = await plantLotsApi.getById(lotId);
      setPlantLot(lot);
      
      // Always try to get the QR code image for display
      try {
        const qrCodeResponse = await plantLotsApi.getQrCode(lotId);
        setPlantLot(prev => prev ? { ...prev, qrCodeImage: qrCodeResponse.qrCode } : null);
      } catch (qrErr) {
        console.log('QR code image not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plant lot');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'seedling':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'growing':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'mature':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'harvesting':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'harvested':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'diseased':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'dead':
        return 'bg-black text-white hover:bg-gray-800';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const canManage = user?.role === 'manager' || user?.role === 'field_staff';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-green-600">Loading plant lot details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 text-xl mb-4">Error</div>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button asChild variant="outline">
                <Link href="/plant-lots">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Plant Lots
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plantLot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-gray-600 text-xl mb-4">Plant lot not found</div>
              <Button asChild variant="outline">
                <Link href="/plant-lots">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Plant Lots
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <Button asChild variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full px-4">
                <Link href="/plant-lots">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="text-sm font-medium text-green-600">My Plant</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">Search...</div>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block">
        <div className="flex flex-col space-y-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-green-50 w-12 h-12">
            <Leaf className="h-5 w-5 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <BarChart3 className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <Activity className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto py-12 px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            {/* Plant Header */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-bold text-gray-900 mb-3 font-['Inter'] tracking-tight">
                {plantLot.species?.name || 'Bird of Paradise Plant'}
              </h1>
              <p className="text-xl text-gray-600 font-light leading-relaxed">
                {plantLot.species?.description || 'Lush, glossy, tropical green leaves.'}
              </p>
            </div>

            {/* Central Plant Display */}
            <div className="relative">
              <Card className="overflow-hidden border-0 shadow-xl bg-white rounded-3xl">
                <CardContent className="p-12 relative">
                  <div className="flex items-center justify-center relative">
                    {/* Main Plant Image Container */}
                    <div className="relative w-96 h-96">
                      {/* Plant Background Circle */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-full shadow-inner"></div>
                      
                      {/* Plant Illustration */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          {/* Plant Pot */}
                          <div className="w-32 h-24 bg-gradient-to-b from-gray-100 to-gray-200 rounded-full mx-auto shadow-lg"></div>
                          
                          {/* Plant Stems and Leaves */}
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
                            <div className="relative">
                              {/* Multiple Leaves */}
                              <Leaf className="w-20 h-20 text-green-500 absolute -rotate-12 -left-8 -top-4 drop-shadow-sm" />
                              <Leaf className="w-24 h-24 text-green-600 absolute rotate-12 right-4 -top-2 drop-shadow-sm" />
                              <Leaf className="w-18 h-18 text-green-400 absolute -rotate-45 -left-4 top-8 drop-shadow-sm" />
                              <Leaf className="w-22 h-22 text-emerald-500 absolute rotate-45 right-2 top-6 drop-shadow-sm" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Floating Status Indicators */}
                      <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chl B level</div>
                        <div className="text-lg font-bold text-gray-900 mt-1">0.738: 00.02b</div>
                      </div>
                      
                      <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chl A level</div>
                        <div className="text-lg font-bold text-gray-900 mt-1">0.749: 00.02b</div>
                      </div>
                      
                      <div className="absolute top-1/2 right-8 transform -translate-y-1/2 bg-red-500/95 backdrop-blur-sm text-white rounded-2xl px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="text-xs font-medium uppercase tracking-wide opacity-90">Soil Health</div>
                        <div className="text-lg font-bold mt-1">Dry & Cracked</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Growth Analysis Card */}
            <Card className="bg-gradient-to-br from-lime-100 via-green-50 to-emerald-100 border-0 shadow-lg rounded-3xl">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-gray-900 text-xl font-bold">Growth AnalysiS</CardTitle>
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-white/50 rounded-full px-3">
                    Month ▼
                  </Button>
                </div>
                <CardDescription className="text-gray-600 font-medium">
                  1 Month Growth Time-Lapse
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Enhanced Growth Chart */}
                <div className="relative h-32 mb-6">
                  <div className="absolute inset-0 flex items-end justify-center">
                    <svg className="w-full h-full" viewBox="0 0 240 80">
                      {/* Glow Effect */}
                      <defs>
                        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.3"/>
                          <stop offset="50%" stopColor="#34d399" stopOpacity="0.6"/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.8"/>
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Growth Curve */}
                      <path
                        d="M 20 60 Q 60 45 120 35 Q 180 25 220 15"
                        stroke="url(#glowGradient)"
                        strokeWidth="4"
                        fill="none"
                        filter="url(#glow)"
                        className="drop-shadow-lg"
                      />
                      
                      {/* Data Points */}
                      <circle cx="220" cy="15" r="6" fill="#10b981" className="drop-shadow-md animate-pulse" />
                      <circle cx="120" cy="35" r="4" fill="#34d399" className="drop-shadow-sm" />
                      <circle cx="60" cy="45" r="4" fill="#6ee7b7" className="drop-shadow-sm" />
                    </svg>
                  </div>
                  
                  {/* Growth Percentage Badge */}
                  <div className="absolute top-4 right-4 bg-gray-900/90 text-white text-sm font-bold px-3 py-2 rounded-full shadow-lg">
                    + 4%
                  </div>
                </div>
                
                {/* Month Labels */}
                <div className="flex justify-between text-sm font-medium text-gray-500 mb-4">
                  <span>mar</span>
                  <span>apr</span>
                  <span>may</span>
                  <span>jun</span>
                  <span>jul</span>
                  <span>aug</span>
                  <span>sep</span>
                </div>
              </CardContent>
            </Card>

            {/* Plant Details Card */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl font-bold flex items-center justify-between">
                  Plant Details
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                  </Button>
                </CardTitle>
                <CardDescription className="text-gray-500 font-medium">Real-time conditions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Sun className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Light Condition</div>
                      <div className="text-sm font-bold text-gray-900 mt-1">Minimal</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Soil Health</div>
                      <div className="text-sm font-bold text-gray-900 mt-1">Dry & Cracked</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Thermometer className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Humidity Level</div>
                      <div className="text-sm font-bold text-gray-900 mt-1">70%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Activity className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fertilization Status</div>
                      <div className="text-sm font-bold text-gray-900 mt-1">Balanced</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plants Monitored Audio Card */}
            <Card className="bg-gray-800 text-white border-0 shadow-xl rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Plants Monitored</h3>
                  <Button variant="secondary" size="icon" className="bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm">
                    <Play className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-gray-300 font-medium mb-6">
                  Guides and best practices
                </p>
                
                {/* Enhanced Audio Visualization */}
                <div className="flex items-center space-x-1 mb-6 h-12">
                  {Array.from({ length: 50 }, (_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-green-600 to-green-400 rounded-full transition-all duration-300"
                      style={{
                        height: `${Math.sin(i * 0.3) * 20 + 25}px`,
                        opacity: 0.3 + Math.random() * 0.7,
                        animationDelay: `${i * 50}ms`
                      }}
                    />
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span className="flex items-center font-medium">
                    <Calendar className="h-4 w-4 mr-2" />
                    1x
                  </span>
                  <span className="font-mono">05:34</span>
                </div>
              </CardContent>
            </Card>

            {/* Plant Information Card */}
            <Card className="border-0 shadow-lg rounded-3xl bg-white">
              <CardHeader>
                <CardTitle className="text-gray-900 text-xl font-bold">Plant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Lot Number:</span>
                  <span className="font-bold text-gray-900">{plantLot.lotNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Plant Count:</span>
                  <span className="font-bold text-gray-900">{plantLot.plantCount}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <Badge className={`${getStatusColor(plantLot.status)} rounded-full px-3 py-1 font-medium`} variant="secondary">
                    {plantLot.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Zone:</span>
                  <span className="font-bold text-gray-900">
                    {plantLot.zone?.name || `Zone ${plantLot.zoneId}`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Planted:</span>
                  <span className="font-bold text-gray-900">
                    {new Date(plantLot.plantedDate).toLocaleDateString()}
                  </span>
                </div>
                {plantLot.location && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Location:</span>
                    <span className="font-bold text-gray-900">
                      S{plantLot.location.section}-R{plantLot.location.row}-C{plantLot.location.column}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {canManage && (
              <div className="space-y-4">
                <Button asChild className="w-full bg-green-600 hover:bg-green-700 rounded-2xl h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href={`/plant-lots/${plantLot.id}/health-log`}>
                    <Plus className="mr-2 h-5 w-5" />
                    Add Health Report
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-2xl h-12 font-medium border-2 hover:bg-gray-50 transition-all duration-300">
                  <Link href={`/plant-lots/${plantLot.id}/edit`}>
                    <Edit className="mr-2 h-5 w-5" />
                    Edit Plant Lot
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Health Log History Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Health Log History</h2>
            <p className="text-lg text-gray-600 font-light">Track your plant's health journey over time</p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <HealthLogHistory plantLotId={plantLot.id} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PlantLotDetailPage({ params }: PlantLotDetailPageProps) {
  const [lotId, setLotId] = useState<number | null>(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params;
      setLotId(parseInt(id));
    };
    unwrapParams();
  }, [params]);

  if (lotId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-green-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return <PlantLotDetailPageClient lotId={lotId} />;
}
