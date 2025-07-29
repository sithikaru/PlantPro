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
import AppLayout from '../../../components/AppLayout';
import { QrCode, Download, Edit, Plus, TrendingUp, Droplets, Sun, Thermometer, Activity, Calendar, MapPin, User, ChevronLeft, Copy } from 'lucide-react';
import HealthLogHistory from '../../../components/health-log-history';
import QRCodeGenerator from 'qrcode';

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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

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
      
      // Generate QR code image if we have the QR code value
      if (lot.qrCode) {
        await generateQRCodeImage(lot.qrCode);
      } else {
        // If not, try to fetch it separately
        try {
          const qrCodeResponse = await plantLotsApi.getQrCode(lotId);
          if (qrCodeResponse && qrCodeResponse.qrCode) {
            setPlantLot(prev => prev ? { ...prev, qrCode: qrCodeResponse.qrCode } : null);
            await generateQRCodeImage(qrCodeResponse.qrCode);
          }
        } catch (qrError) {
          console.warn('Failed to fetch QR code:', qrError);
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plant lot');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeImage = async (qrCodeValue: string) => {
    try {
      const dataUrl = await QRCodeGenerator.toDataURL(qrCodeValue, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error('Failed to generate QR code image:', err);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl || !plantLot) return;
    
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `plant-lot-${plantLot.id}-qr.png`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': 
      case 'excellent':
      case 'good': return 'bg-green-100 text-green-800 border-green-200';
      case 'diseased': 
      case 'critical':
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      case 'fair': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'dead': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
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
                <p className="mt-4 text-green-600 font-medium">Loading plant lot details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-96 shadow-xl rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Plant Lot</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchPlantLot} className="rounded-xl">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!plantLot) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-96 shadow-xl rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="text-gray-400 text-5xl mb-4">🌱</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Plant Lot Not Found</h3>
                <p className="text-gray-600 mb-4">The requested plant lot could not be found.</p>
                <Link href="/plant-lots">
                  <Button className="rounded-xl">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Plant Lots
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/plant-lots">
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Plant Lot #{plantLot.id}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {plantLot.species?.name || 'Unknown species'} • {plantLot.location ? 
                      `S${plantLot.location.section}-R${plantLot.location.row}-C${plantLot.location.column}` : 
                      'No location'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge 
                  variant="outline" 
                  className={`px-3 py-1 rounded-xl border ${getStatusColor(plantLot.status)}`}
                >
                  <Activity className="w-3 h-3 mr-1" />
                  {plantLot.status}
                </Badge>
                <Link href={`/plant-lots/${plantLot.id}/edit`}>
                  <Button className="rounded-xl">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Lot
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Plant Information */}
              <Card className="shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Plant Information</CardTitle>
                      <CardDescription>Basic details about this plant lot</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Species</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{plantLot.species?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Scientific Name</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{plantLot.species?.scientificName || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Plant Count</label>
                        <p className="text-lg font-semibold text-gray-900 mt-1">{plantLot.plantCount} plants</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Location</label>
                        <div className="flex items-center mt-1">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">
                            {plantLot.location ? 
                              `S${plantLot.location.section}-R${plantLot.location.row}-C${plantLot.location.column}` : 
                              'No location assigned'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Planted Date</label>
                        <div className="flex items-center mt-1">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(plantLot.plantedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Managed By</label>
                        <div className="flex items-center mt-1">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <p className="text-lg font-semibold text-gray-900">{plantLot.assignedTo?.firstName} {plantLot.assignedTo?.lastName || 'Unassigned'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {plantLot.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Notes</label>
                      <p className="text-gray-700 mt-2 p-4 bg-gray-50 rounded-xl">{plantLot.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Health Log History */}
              <Card className="shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Health History</CardTitle>
                        <CardDescription>Track health changes over time</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/health-logs/na/plantLotId=${plantLot.id}`}>
                        <Button size="sm" variant="outline" className="rounded-xl">
                          <Activity className="w-4 h-4 mr-2" />
                          Analyze Health
                        </Button>
                      </Link>
                      <Link href={`/health-logs/new?plantLotId=${plantLot.id}`}>
                        <Button size="sm" className="rounded-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Log
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <HealthLogHistory plantLotId={plantLot.id} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code */}
              <Card className="shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <QrCode className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">QR Code</CardTitle>
                      <CardDescription>Quick access identifier</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    {qrCodeDataUrl ? (
                      <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Code" 
                          className="w-48 h-48 rounded-lg"
                        />
                      </div>
                    ) : plantLot.qrCode ? (
                      <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg">
                          <div className="text-center">
                            <QrCode className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 font-mono break-all px-2">
                              {plantLot.qrCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-8 rounded-xl border-2 border-dashed border-gray-300 text-center">
                        <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No QR code available</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={() => plantLot?.qrCode && generateQRCodeImage(plantLot.qrCode)}
                      variant="outline"
                      className="w-full rounded-xl"
                      disabled={!plantLot?.qrCode}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      {qrCodeDataUrl ? 'Regenerate' : 'Generate'} QR Code
                    </Button>
                    {qrCodeDataUrl && (
                      <Button
                        onClick={downloadQRCode}
                        variant="outline"
                        className="w-full rounded-xl"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PNG
                      </Button>
                    )}
                    {plantLot?.qrCode && (
                      <Button
                        onClick={() => navigator.clipboard.writeText(plantLot.qrCode)}
                        variant="outline"
                        className="w-full rounded-xl"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
                      <CardDescription>At a glance metrics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl text-center">
                      <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-900">
                        {Math.floor((new Date().getTime() - new Date(plantLot.plantedDate).getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">Days Old</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl text-center">
                      <Activity className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-900">{plantLot.plantCount}</p>
                      <p className="text-xs text-green-600 font-medium">Plants</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-2">Health Status</h4>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        plantLot.status === 'mature' || plantLot.status === 'growing' ? 'bg-green-500' :
                        plantLot.status === 'diseased' ? 'bg-red-500' :
                        plantLot.status === 'seedling' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {plantLot.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-xl rounded-3xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                  <CardDescription>Common tasks for this lot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/health-logs/new?plantLotId=${plantLot.id}`}>
                    <Button variant="outline" className="w-full justify-start rounded-xl">
                      <Plus className="w-4 h-4 mr-3" />
                      Add Health Log
                    </Button>
                  </Link>
                  <Link href={`/plant-lots/${plantLot.id}/edit`}>
                    <Button variant="outline" className="w-full justify-start rounded-xl">
                      <Edit className="w-4 h-4 mr-3" />
                      Edit Plant Lot
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function PlantLotDetailPage({ params }: PlantLotDetailPageProps) {
  const [lotId, setLotId] = useState<number | null>(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      const id = parseInt(resolvedParams.id);
      if (!isNaN(id)) {
        setLotId(id);
      }
    };
    unwrapParams();
  }, [params]);

  if (lotId === null) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-96 shadow-xl rounded-3xl">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-green-600 font-medium">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return <PlantLotDetailPageClient lotId={lotId} />;
}
