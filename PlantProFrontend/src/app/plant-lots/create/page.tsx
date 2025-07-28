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
import AppLayout from '../../../components/AppLayout';
import { 
  Plus, 
  MapPin, 
  Users, 
  Calendar, 
  Activity
} from 'lucide-react';

export default function CreatePlantLotPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plantSpecies, setPlantSpecies] = useState<PlantSpecies[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [fieldStaff, setFieldStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreatePlantLotData>({
    speciesId: 0,
    plantedDate: '',
    plantCount: 0,
    zoneId: 0,
    assignedToId: 0,
    notes: ''
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'field_staff') {
      fetchData();
    } else if (isAuthenticated && user?.role === 'field_staff') {
      router.push('/plant-lots');
    }
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [speciesRes, zonesRes, staffRes] = await Promise.all([
        plantSpeciesApi.getAll(),
        zonesApi.getAll(),
        usersApi.getAll()
      ]);

      setPlantSpecies(speciesRes);
      setZones(zonesRes);
      setFieldStaff(staffRes.filter((u: User) => u.role === 'field_staff'));
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load required data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.speciesId || !formData.plantedDate || 
        !formData.plantCount || !formData.zoneId || !formData.assignedToId) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      await plantLotsApi.create(formData);
      router.push('/plant-lots');
    } catch (err: any) {
      console.error('Error creating plant lot:', err);
      setError(err.response?.data?.message || 'Failed to create plant lot');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.role === 'field_staff') {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="border-0 shadow-xl rounded-3xl bg-white max-w-md">
            <CardContent className="p-8 text-center">
              <div className="text-red-600 text-5xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to create plant lots.
              </p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/plant-lots">Back to Plant Lots</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-6">
                <h1 className="text-2xl font-bold text-gray-900 font-['Inter'] tracking-tight">
                  Create Plant Lot
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link href="/plant-lots">
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-12 px-6 lg:px-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-3 font-['Inter'] tracking-tight">
                Create New Plant Lot
              </h2>
              <p className="text-xl text-gray-600 font-light leading-relaxed">
                Add a new plant lot to your plantation management system
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

            {/* Form */}
            <Card className="border-0 shadow-xl rounded-3xl bg-white">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                  <Plus className="mr-3 h-6 w-6 text-green-600" />
                  Plant Lot Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Plant Species */}
                    <div className="space-y-3">
                      <Label htmlFor="speciesId" className="text-gray-700 font-medium">
                        Plant Species *
                      </Label>
                      <select
                        id="speciesId"
                        name="speciesId"
                        value={formData.speciesId}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-500 px-4 py-3"
                        required
                      >
                        <option value="">Select plant species</option>
                        {plantSpecies.map(species => (
                          <option key={species.id} value={species.id}>
                            {species.name} ({species.scientificName})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Zone */}
                    <div className="space-y-3">
                      <Label htmlFor="zoneId" className="text-gray-700 font-medium flex items-center">
                        <MapPin className="mr-2 h-4 w-4" />
                        Zone *
                      </Label>
                      <select
                        id="zoneId"
                        name="zoneId"
                        value={formData.zoneId}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-500 px-4 py-3"
                        required
                      >
                        <option value="">Select zone</option>
                        {zones.map(zone => (
                          <option key={zone.id} value={zone.id}>
                            {zone.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Planted Date */}
                    <div className="space-y-3">
                      <Label htmlFor="plantedDate" className="text-gray-700 font-medium flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Planted Date *
                      </Label>
                      <Input
                        id="plantedDate"
                        name="plantedDate"
                        type="date"
                        value={formData.plantedDate}
                        onChange={handleInputChange}
                        className="rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>

                    {/* Plant Count */}
                    <div className="space-y-3">
                      <Label htmlFor="plantCount" className="text-gray-700 font-medium">
                        Plant Count *
                      </Label>
                      <Input
                        id="plantCount"
                        name="plantCount"
                        type="number"
                        min="1"
                        value={formData.plantCount || ''}
                        onChange={handleInputChange}
                        className="rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                        placeholder="Enter number of plants"
                        required
                      />
                    </div>

                    {/* Assigned To */}
                    <div className="space-y-3 md:col-span-2">
                      <Label htmlFor="assignedToId" className="text-gray-700 font-medium flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Assigned To *
                      </Label>
                      <select
                        id="assignedToId"
                        name="assignedToId"
                        value={formData.assignedToId}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-500 px-4 py-3"
                        required
                      >
                        <option value="">Select field staff</option>
                        {fieldStaff.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.firstName} {staff.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-gray-700 font-medium flex items-center">
                      <Activity className="mr-2 h-4 w-4" />
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="rounded-2xl border-gray-200 focus:border-green-500 focus:ring-green-500 min-h-[120px]"
                      placeholder="Enter any additional notes or observations..."
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6">
                    <Button 
                      asChild 
                      variant="outline" 
                      className="rounded-2xl px-8"
                    >
                      <Link href="/plant-lots">Cancel</Link>
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 rounded-2xl px-8 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Plant Lot
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
