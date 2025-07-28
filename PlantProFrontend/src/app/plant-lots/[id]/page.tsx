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
import { ArrowLeft, QrCode, Download, Edit, Plus, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                <Link href="/plant-lots">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Plant Lots
                </Link>
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Plant Lot: {plantLot.lotNumber}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <>
                  <Button asChild variant="outline">
                    <Link href={`/plant-lots/${plantLot.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button onClick={generateQRCode} className="bg-green-600 hover:bg-green-700">
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-800">Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Lot Number</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-semibold">{plantLot.lotNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <Badge className={getStatusColor(plantLot.status)} variant="secondary">
                          {plantLot.status}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Species</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {plantLot.species?.name || `Species ID: ${plantLot.speciesId}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Zone</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {plantLot.zone?.name || `Zone ID: ${plantLot.zoneId}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Plant Count</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-semibold">{plantLot.plantCount}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Planted Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(plantLot.plantedDate).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Location Details */}
              {plantLot.location && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-800">Location Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Section</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-semibold">{plantLot.location.section}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Row</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-semibold">{plantLot.location.row}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Column</dt>
                        <dd className="mt-1 text-sm text-gray-900 font-semibold">{plantLot.location.column}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              )}

              {/* Yield Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-800">Yield Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Current Yield</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-semibold">
                        {plantLot.currentYield ? `${plantLot.currentYield} kg` : 'Not harvested yet'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Expected Yield</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {plantLot.species?.expectedYieldPerPlant 
                          ? `${plantLot.species.expectedYieldPerPlant * plantLot.plantCount} ${plantLot.species.yieldUnit}` 
                          : 'Not specified'}
                      </dd>
                    </div>
                  </dl>
                  {plantLot.actualHarvestDate && (
                    <div className="mt-4">
                      <dt className="text-sm font-medium text-gray-500">Harvest Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-semibold">
                        {new Date(plantLot.actualHarvestDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {plantLot.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-800">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{plantLot.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center">
                    <QrCode className="mr-2 h-5 w-5" />
                    QR Code
                  </CardTitle>
                  <CardDescription>
                    Generate and manage QR code for this plant lot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {plantLot.qrCode ? (
                    <div className="text-center">
                      <div className="mb-4">
                        <img
                          src={plantLot.qrCode}
                          alt="Plant Lot QR Code"
                          className="mx-auto border border-green-200 rounded-lg"
                          width="200"
                          height="200"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Scan this QR code to quickly access this plant lot
                      </p>
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = plantLot.qrCode;
                          link.download = `plant-lot-${plantLot.lotNumber}-qr.png`;
                          link.click();
                        }}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">No QR code generated</p>
                      {canManage && (
                        <Button
                          onClick={generateQRCode}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          Generate QR Code
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {canManage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-800">Quick Actions</CardTitle>
                    <CardDescription>
                      Manage and update this plant lot
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/plant-lots/${plantLot.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Plant Lot
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/plant-lots/${plantLot.id}/health-log`}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Health Log
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/plant-lots/${plantLot.id}/update-yield`}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Update Yield
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-800">Recent Activity</CardTitle>
                  <CardDescription>
                    Plant lot creation and modification history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900 font-semibold">
                        {new Date(plantLot.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 text-gray-900 font-semibold">
                        {new Date(plantLot.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
