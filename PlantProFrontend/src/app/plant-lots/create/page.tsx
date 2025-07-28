'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi, plantSpeciesApi, zonesApi, usersApi } from '../../../lib/api';
import { PlantSpecies, Zone, User, CreatePlantLotData } from '../../../lib/types';

export default function CreatePlantLotPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plantSpecies, setPlantSpecies] = useState<PlantSpecies[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [fieldStaff, setFieldStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePlantLotData & { 
    hasLocation: boolean;
    section?: string;
    row?: number;
    column?: number;
  }>({
    speciesId: 0,
    zoneId: 0,
    plantCount: 1,
    plantedDate: new Date().toISOString().split('T')[0],
    hasLocation: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'analytics') {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [speciesResponse, zonesResponse, usersResponse] = await Promise.all([
        plantSpeciesApi.getAll(),
        zonesApi.getAll(),
        usersApi.getFieldStaff(),
      ]);

      setPlantSpecies(speciesResponse);
      setZones(zonesResponse);
      setFieldStaff(usersResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.speciesId || !formData.zoneId) {
      setError('Please select both species and zone');
      return;
    }

    if (formData.plantCount < 1) {
      setError('Plant count must be at least 1');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submitData: CreatePlantLotData = {
        speciesId: formData.speciesId,
        zoneId: formData.zoneId,
        plantCount: formData.plantCount,
        plantedDate: formData.plantedDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        assignedToId: formData.assignedToId,
        notes: formData.notes,
      };

      if (formData.hasLocation && formData.section && formData.row && formData.column) {
        submitData.location = {
          section: formData.section,
          row: formData.row,
          column: formData.column,
        };
      }

      const newPlantLot = await plantLotsApi.create(submitData);
      router.push(`/plant-lots/${newPlantLot.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plant lot');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateExpectedHarvestDate = (plantedDate: string, speciesId: number) => {
    const species = plantSpecies.find(s => s.id === speciesId);
    if (!species || !plantedDate) return '';
    
    const planted = new Date(plantedDate);
    const harvest = new Date(planted);
    harvest.setDate(harvest.getDate() + species.growthPeriodDays);
    
    return harvest.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (formData.plantedDate && formData.speciesId) {
      const expectedDate = calculateExpectedHarvestDate(formData.plantedDate, formData.speciesId);
      setFormData(prev => ({ ...prev, expectedHarvestDate: expectedDate }));
    }
  }, [formData.plantedDate, formData.speciesId, plantSpecies]);

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
                                <p className="text-gray-600 mb-4">You don&apos;t have permission to create plant lots.</p>
          <Link href="/dashboard" className="text-green-600 hover:text-green-700">
            ← Back to Dashboard
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
              <h1 className="text-xl font-semibold text-gray-900">Create New Plant Lot</h1>
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

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="speciesId" className="block text-sm font-medium text-gray-700">
                      Plant Species *
                    </label>
                    <select
                      id="speciesId"
                      required
                      value={formData.speciesId}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        speciesId: parseInt(e.target.value) 
                      }))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    >
                      <option value="0">Select a species</option>
                      {plantSpecies.map((species) => (
                        <option key={species.id} value={species.id}>
                          {species.name} ({species.scientificName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="zoneId" className="block text-sm font-medium text-gray-700">
                      Zone *
                    </label>
                    <select
                      id="zoneId"
                      required
                      value={formData.zoneId}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        zoneId: parseInt(e.target.value) 
                      }))}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                    >
                      <option value="0">Select a zone</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="plantCount" className="block text-sm font-medium text-gray-700">
                      Plant Count *
                    </label>
                    <input
                      type="number"
                      id="plantCount"
                      required
                      min="1"
                      value={formData.plantCount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        plantCount: parseInt(e.target.value) 
                      }))}
                      className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="plantedDate" className="block text-sm font-medium text-gray-700">
                      Planted Date *
                    </label>
                    <input
                      type="date"
                      id="plantedDate"
                      required
                      value={formData.plantedDate}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        plantedDate: e.target.value 
                      }))}
                      className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
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
                    <p className="mt-1 text-xs text-gray-500">
                      Auto-calculated based on species growth period
                    </p>
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
                    Specify location details
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
                  href="/plant-lots"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Plant Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
