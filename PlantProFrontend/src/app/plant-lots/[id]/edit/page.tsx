'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi, plantSpeciesApi, zonesApi, usersApi } from '../../../../lib/api';
import { PlantLot, PlantSpecies, Zone, User, UpdatePlantLotData } from '../../../../lib/types';

interface EditPlantLotPageProps {
  params: Promise<{
    id: string;
  }>;
}

function EditPlantLotPageClient({ lotId }: { lotId: number }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plantLot, setPlantLot] = useState<PlantLot | null>(null);
  const [plantSpecies, setPlantSpecies] = useState<PlantSpecies[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [fieldStaff, setFieldStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdatePlantLotData & { 
    hasLocation: boolean;
    section?: string;
    row?: number;
    column?: number;
  }>({
    hasLocation: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'analytics' && lotId) {
      fetchData();
    }
  }, [isAuthenticated, user, lotId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plantLotResponse, speciesResponse, zonesResponse, usersResponse] = await Promise.all([
        plantLotsApi.getById(lotId),
        plantSpeciesApi.getAll(),
        zonesApi.getAll(),
        usersApi.getFieldStaff(),
      ]);

      setPlantLot(plantLotResponse);
      setPlantSpecies(speciesResponse);
      setZones(zonesResponse);
      setFieldStaff(usersResponse);

      // Initialize form with current data
      setFormData({
        plantCount: plantLotResponse.plantCount,
        expectedHarvestDate: plantLotResponse.expectedHarvestDate,
        actualHarvestDate: plantLotResponse.actualHarvestDate,
        status: plantLotResponse.status,
        currentYield: plantLotResponse.currentYield,
        assignedToId: plantLotResponse.assignedToId,
        notes: plantLotResponse.notes,
        hasLocation: !!plantLotResponse.location,
        section: plantLotResponse.location?.section,
        row: plantLotResponse.location?.row,
        column: plantLotResponse.location?.column,
        location: plantLotResponse.location,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.plantCount && formData.plantCount < 1) {
      setError('Plant count must be at least 1');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData: UpdatePlantLotData = {
        plantCount: formData.plantCount,
        expectedHarvestDate: formData.expectedHarvestDate,
        actualHarvestDate: formData.actualHarvestDate,
        status: formData.status,
        currentYield: formData.currentYield,
        assignedToId: formData.assignedToId,
        notes: formData.notes,
      };

      if (formData.hasLocation && formData.section && formData.row && formData.column) {
        submitData.location = {
          section: formData.section,
          row: formData.row,
          column: formData.column,
        };
      } else if (!formData.hasLocation) {
        submitData.location = undefined;
      }

      await plantLotsApi.update(lotId, submitData);
      router.push(`/plant-lots/${lotId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plant lot');
    } finally {
      setSubmitting(false);
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

  if (authLoading || loading) {
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

  if (user.role === 'analytics') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Access Denied</div>
          <p className="text-gray-600 mb-4">You don't have permission to edit plant lots.</p>
          <Link href="/dashboard" className="text-green-600 hover:text-green-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error && !plantLot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/plant-lots" className="text-green-600 hover:text-green-700">
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
          <Link href="/plant-lots" className="text-green-600 hover:text-green-700">
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
              <Link href={`/plant-lots/${lotId}`} className="text-green-600 hover:text-green-700">
                ← Back to Plant Lot
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Edit Plant Lot: {plantLot.lotNumber}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Current Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Current Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Species:</span>
                <div className="font-medium">{plantLot.species?.name}</div>
              </div>
              <div>
                <span className="text-blue-600">Zone:</span>
                <div className="font-medium">{plantLot.zone?.name}</div>
              </div>
              <div>
                <span className="text-blue-600">Planted:</span>
                <div className="font-medium">{new Date(plantLot.plantedDate).toLocaleDateString()}</div>
              </div>
              <div>
                <span className="text-blue-600">Current Status:</span>
                <div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plantLot.status)}`}>
                    {plantLot.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
              {/* Basic Updates */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="plantCount" className="block text-sm font-medium text-gray-700">
                      Plant Count
                    </label>
                    <input
                      type="number"
                      id="plantCount"
                      min="1"
                      value={formData.plantCount || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        plantCount: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        status: e.target.value 
                      }))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    >
                      <option value="seedling">Seedling</option>
                      <option value="growing">Growing</option>
                      <option value="mature">Mature</option>
                      <option value="harvesting">Harvesting</option>
                      <option value="harvested">Harvested</option>
                      <option value="diseased">Diseased</option>
                      <option value="dead">Dead</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="expectedHarvestDate" className="block text-sm font-medium text-gray-700">
                      Expected Harvest Date
                    </label>
                    <input
                      type="date"
                      id="expectedHarvestDate"
                      value={formData.expectedHarvestDate || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        expectedHarvestDate: e.target.value 
                      }))}
                      className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="actualHarvestDate" className="block text-sm font-medium text-gray-700">
                      Actual Harvest Date
                    </label>
                    <input
                      type="date"
                      id="actualHarvestDate"
                      value={formData.actualHarvestDate || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        actualHarvestDate: e.target.value 
                      }))}
                      className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="currentYield" className="block text-sm font-medium text-gray-700">
                      Current Yield (kg)
                    </label>
                    <input
                      type="number"
                      id="currentYield"
                      step="0.01"
                      min="0"
                      value={formData.currentYield || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        currentYield: e.target.value ? parseFloat(e.target.value) : undefined 
                      }))}
                      className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700">
                      Assign to Field Staff
                    </label>
                    <select
                      id="assignedToId"
                      value={formData.assignedToId || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        assignedToId: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    >
                      <option value="">No assignment</option>
                      {fieldStaff.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.firstName} {staff.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <div className="flex items-center mb-4">
                  <input
                    id="hasLocation"
                    type="checkbox"
                    checked={formData.hasLocation}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      hasLocation: e.target.checked,
                      section: e.target.checked ? prev.section : undefined,
                      row: e.target.checked ? prev.row : undefined,
                      column: e.target.checked ? prev.column : undefined,
                    }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasLocation" className="ml-2 block text-sm font-medium text-gray-700">
                    Update location details
                  </label>
                </div>

                {formData.hasLocation && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                        Section
                      </label>
                      <input
                        type="text"
                        id="section"
                        value={formData.section || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          section: e.target.value 
                        }))}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g., A, B, North"
                      />
                    </div>

                    <div>
                      <label htmlFor="row" className="block text-sm font-medium text-gray-700">
                        Row
                      </label>
                      <input
                        type="number"
                        id="row"
                        min="1"
                        value={formData.row || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          row: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label htmlFor="column" className="block text-sm font-medium text-gray-700">
                        Column
                      </label>
                      <input
                        type="number"
                        id="column"
                        min="1"
                        value={formData.column || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          column: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Any additional notes about this plant lot..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3">
                <Link
                  href={`/plant-lots/${lotId}`}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Plant Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default async function EditPlantLotPage({ params }: EditPlantLotPageProps) {
  const { id } = await params;
  const lotId = parseInt(id);
  
  return <EditPlantLotPageClient lotId={lotId} />;
}
