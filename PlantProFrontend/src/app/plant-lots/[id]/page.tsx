'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi } from '../../../lib/api';
import { PlantLot } from '../../../lib/types';

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
  const [showQR, setShowQR] = useState(false);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plant lot');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrCodeResponse = await plantLotsApi.getQrCode(lotId);
      setPlantLot(prev => prev ? { ...prev, qrCode: qrCodeResponse.qrCode } : null);
      setShowQR(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'seedling':
        return 'bg-yellow-100 text-yellow-800';
      case 'growing':
        return 'bg-green-100 text-green-800';
      case 'mature':
        return 'bg-blue-100 text-blue-800';
      case 'harvesting':
        return 'bg-purple-100 text-purple-800';
      case 'harvested':
        return 'bg-gray-100 text-gray-800';
      case 'diseased':
        return 'bg-red-100 text-red-800';
      case 'dead':
        return 'bg-black text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManage = user?.role === 'manager' || user?.role === 'field_staff';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading plant lot details...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/plant-lots"
            className="text-green-600 hover:text-green-700"
          >
            ← Back to Plant Lots
          </Link>
        </div>
      </div>
    );
  }

  if (!plantLot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Plant lot not found</div>
          <Link
            href="/plant-lots"
            className="text-green-600 hover:text-green-700"
          >
            ← Back to Plant Lots
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/plant-lots" className="text-green-600 hover:text-green-700">
                ← Back to Plant Lots
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Plant Lot: {plantLot.lotNumber}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <>
                  <Link
                    href={`/plant-lots/${plantLot.id}/edit`}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={generateQRCode}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Generate QR Code
                  </button>
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
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Basic Information
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Lot Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{plantLot.lotNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plantLot.status)}`}>
                          {plantLot.status}
                        </span>
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
                      <dd className="mt-1 text-sm text-gray-900">{plantLot.plantCount}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Planted Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(plantLot.plantedDate).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Location Details */}
              {plantLot.location && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Location Details
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Section</dt>
                        <dd className="mt-1 text-sm text-gray-900">{plantLot.location.section}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Row</dt>
                        <dd className="mt-1 text-sm text-gray-900">{plantLot.location.row}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Column</dt>
                        <dd className="mt-1 text-sm text-gray-900">{plantLot.location.column}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}

              {/* Yield Information */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Yield Information
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Current Yield</dt>
                      <dd className="mt-1 text-sm text-gray-900">
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
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(plantLot.actualHarvestDate).toLocaleDateString()}
                      </dd>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {plantLot.notes && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Notes
                    </h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{plantLot.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    QR Code
                  </h3>
                  {plantLot.qrCode ? (
                    <div className="text-center">
                      <div className="mb-4">
                        <img
                          src={`data:image/png;base64,${plantLot.qrCode}`}
                          alt="Plant Lot QR Code"
                          className="mx-auto"
                          width="200"
                          height="200"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mb-4">
                        Scan this QR code to quickly access this plant lot
                      </p>
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `data:image/png;base64,${plantLot.qrCode}`;
                          link.download = `plant-lot-${plantLot.lotNumber}-qr.png`;
                          link.click();
                        }}
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        Download QR Code
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">No QR code generated</p>
                      {canManage && (
                        <button
                          onClick={generateQRCode}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                          Generate QR Code
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {canManage && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <Link
                        href={`/plant-lots/${plantLot.id}/edit`}
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Edit Plant Lot
                      </Link>
                      <Link
                        href={`/plant-lots/${plantLot.id}/health-log`}
                        className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white text-center px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Add Health Log
                      </Link>
                      <Link
                        href={`/plant-lots/${plantLot.id}/update-yield`}
                        className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Update Yield
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(plantLot.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(plantLot.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return <PlantLotDetailPageClient lotId={lotId} />;
}
