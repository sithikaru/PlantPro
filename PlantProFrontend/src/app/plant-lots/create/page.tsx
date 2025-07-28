'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi, plantSpeciesApi, zonesApi, usersApi } from '../../../lib/api';
import { PlantSpecies, Zone, User, CreatePlantLotData } from '../../../lib/types';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { 
  ArrowLeft, 
  Plus, 
  Leaf, 
  MapPin, 
  Users, 
  Calendar, 
  BarChart3,
  Activity,
  Scan
} from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96 border-0 shadow-xl rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
              <p className="mt-6 text-gray-600 font-medium">Loading form data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.role === 'analytics') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96 border-0 shadow-xl rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-6">You don't have permission to create plant lots.</p>
              <Button asChild className="bg-green-600 hover:bg-green-700 rounded-2xl">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <Button asChild variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full px-4">
                <Link href="/plant-lots">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Plant Lots
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-200"></div>
              <h1 className="text-2xl font-bold text-gray-900 font-['Inter'] tracking-tight">Create New Plant Lot</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="fixed left-6 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block">
        <div className="flex flex-col space-y-4">
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <Link href="/dashboard">
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <Link href="/qr-scanner">
              <Scan className="h-5 w-5 text-gray-600" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 w-12 h-12">
            <Link href="/plant-lots">
              <Leaf className="h-5 w-5 text-gray-600" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-green-50 w-12 h-12">
            <Plus className="h-5 w-5 text-green-600" />
          </Button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto py-12 px-6 lg:px-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-3 font-['Inter'] tracking-tight">
              Create New Plant Lot
            </h2>
            <p className="text-xl text-gray-600 font-light leading-relaxed">
              Add a new plant lot to the plantation management system
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-0 shadow-lg rounded-3xl bg-red-50 border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="text-red-700 font-medium">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Main Form */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Leaf className="mr-3 h-6 w-6 text-green-600" />
                Plant Lot Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="speciesId" className="text-gray-700 font-medium text-sm">
                        Plant Species *
                      </Label>
                      <select
                        id="speciesId"
                        required
                        value={formData.speciesId}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          speciesId: parseInt(e.target.value) 
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-0 font-medium"
                      >
                        <option value="0">Select a species</option>
                        {plantSpecies.map((species) => (
                          <option key={species.id} value={species.id}>
                            {species.name} ({species.scientificName})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zoneId" className="text-gray-700 font-medium text-sm">
                        Zone *
                      </Label>
                      <select
                        id="zoneId"
                        required
                        value={formData.zoneId}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          zoneId: parseInt(e.target.value) 
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-0 font-medium"
                      >
                        <option value="0">Select a zone</option>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plantCount" className="text-gray-700 font-medium text-sm">
                        Plant Count *
                      </Label>
                      <Input
                        type="number"
                        id="plantCount"
                        required
                        min="1"
                        value={formData.plantCount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          plantCount: parseInt(e.target.value) 
                        }))}
                        className="h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plantedDate" className="text-gray-700 font-medium text-sm">
                        Planted Date *
                      </Label>
                      <Input
                        type="date"
                        id="plantedDate"
                        required
                        value={formData.plantedDate}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          plantedDate: e.target.value 
                        }))}
                        className="h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedHarvestDate" className="text-gray-700 font-medium text-sm">
                        Expected Harvest Date
                      </Label>
                      <Input
                        type="date"
                        id="expectedHarvestDate"
                        value={formData.expectedHarvestDate || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          expectedHarvestDate: e.target.value 
                        }))}
                        className="h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0"
                      />
                      <p className="text-xs text-gray-500">
                        Auto-calculated based on species growth period
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assignedToId" className="text-gray-700 font-medium text-sm">
                        Assign to Field Staff
                      </Label>
                      <select
                        id="assignedToId"
                        value={formData.assignedToId || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          assignedToId: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-0 font-medium"
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
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Location Details
                  </h3>
                  
                  <div className="flex items-center space-x-3">
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
                    <Label htmlFor="hasLocation" className="text-gray-700 font-medium">
                      Specify detailed location coordinates
                    </Label>
                  </div>

                  {formData.hasLocation && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-2xl">
                      <div className="space-y-2">
                        <Label htmlFor="section" className="text-gray-700 font-medium text-sm">
                          Section
                        </Label>
                        <Input
                          type="text"
                          id="section"
                          value={formData.section || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            section: e.target.value 
                          }))}
                          className="h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0"
                          placeholder="e.g., A, B, North"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="row" className="text-gray-700 font-medium text-sm">
                          Row
                        </Label>
                        <Input
                          type="number"
                          id="row"
                          min="1"
                          value={formData.row || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            row: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          className="h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="column" className="text-gray-700 font-medium text-sm">
                          Column
                        </Label>
                        <Input
                          type="number"
                          id="column"
                          min="1"
                          value={formData.column || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            column: e.target.value ? parseInt(e.target.value) : undefined 
                          }))}
                          className="h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Additional Notes
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-gray-700 font-medium text-sm">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="notes"
                      rows={4}
                      value={formData.notes || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        notes: e.target.value 
                      }))}
                      className="rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0 resize-none"
                      placeholder="Any additional notes about this plant lot..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button asChild variant="outline" className="rounded-2xl h-12 px-6 border-2">
                    <Link href="/plant-lots">
                      Cancel
                    </Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 rounded-2xl h-12 px-6 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Create Plant Lot</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
