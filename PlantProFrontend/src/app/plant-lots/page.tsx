'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi, plantSpeciesApi, zonesApi } from '../../lib/api';
import { PlantLot, PlantSpecies, Zone } from '../../lib/types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  ArrowLeft, 
  Leaf, 
  Plus,
  Activity,
  BarChart3,
  Scan,
  Edit3,
  Eye,
  MapPin,
  Search,
  Filter
} from 'lucide-react';

export default function PlantLotsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plantLots, setPlantLots] = useState<PlantLot[]>([]);
  const [plantSpecies, setPlantSpecies] = useState<PlantSpecies[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, selectedZone, selectedSpecies, selectedStatus, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch plant lots with filters
      const filters: Record<string, string | number> = { page: currentPage, limit: 10 };
      if (selectedZone) filters.zoneId = parseInt(selectedZone);
      if (selectedSpecies) filters.speciesId = parseInt(selectedSpecies);
      if (selectedStatus) filters.status = selectedStatus;

      const [plantLotsResponse, speciesResponse, zonesResponse] = await Promise.all([
        plantLotsApi.getAll(filters),
        plantSpeciesApi.getAll(),
        zonesApi.getAll(),
      ]);

      setPlantLots(plantLotsResponse.data);
      setTotalPages(plantLotsResponse.meta.totalPages);
      setPlantSpecies(speciesResponse);
      setZones(zonesResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plant lots');
    } finally {
      setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96 border-0 shadow-xl rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
              <p className="mt-6 text-gray-600 font-medium">Loading plant lots...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <Button asChild variant="ghost" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full px-4">
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-200"></div>
              <h1 className="text-2xl font-bold text-gray-900 font-['Inter'] tracking-tight">
                Plant Lots
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {canManage && (
                <Button asChild className="bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <Link href="/plant-lots/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Plant Lot
                  </Link>
                </Button>
              )}
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
          <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-md hover:shadow-lg hover:bg-green-50 w-12 h-12">
            <Leaf className="h-5 w-5 text-green-600" />
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-3 font-['Inter'] tracking-tight">
              Plant Lot Management
            </h2>
            <p className="text-xl text-gray-600 font-light leading-relaxed">
              Monitor and manage all plant lots across your plantation
            </p>
          </div>

          {/* Filters Card */}
          <Card className="border-0 shadow-xl rounded-3xl bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <Filter className="mr-3 h-6 w-6 text-blue-600" />
                Filter Plant Lots
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="zone" className="text-gray-700 font-medium text-sm">
                    Zone
                  </Label>
                  <select
                    id="zone"
                    value={selectedZone}
                    onChange={(e) => {
                      setSelectedZone(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-0 font-medium h-12"
                  >
                    <option value="">All Zones</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="species" className="text-gray-700 font-medium text-sm">
                    Species
                  </Label>
                  <select
                    id="species"
                    value={selectedSpecies}
                    onChange={(e) => {
                      setSelectedSpecies(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-0 font-medium h-12"
                  >
                    <option value="">All Species</option>
                    {plantSpecies.map((species) => (
                      <option key={species.id} value={species.id}>
                        {species.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-700 font-medium text-sm">
                    Status
                  </Label>
                  <select
                    id="status"
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-0 font-medium h-12"
                  >
                    <option value="">All Statuses</option>
                    <option value="seedling">Seedling</option>
                    <option value="growing">Growing</option>
                    <option value="mature">Mature</option>
                    <option value="harvesting">Harvesting</option>
                    <option value="harvested">Harvested</option>
                    <option value="diseased">Diseased</option>
                    <option value="dead">Dead</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="border-0 shadow-lg rounded-3xl bg-red-50 border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="text-red-700 font-medium">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Plant Lots Grid */}
          {plantLots.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plantLots.map((lot) => (
                  <Card key={lot.id} className="border-0 shadow-xl rounded-3xl bg-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                            {lot.lotNumber}
                          </CardTitle>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              {lot.species?.name || `Species ID: ${lot.speciesId}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Planted: {new Date(lot.plantedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lot.status)}`}>
                          {lot.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Location */}
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">
                              {lot.zone?.name || `Zone ID: ${lot.zoneId}`}
                            </span>
                            {lot.location && (
                              <div className="text-xs text-gray-500">
                                Section {lot.location.section}, Row {lot.location.row}, Col {lot.location.column}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Plant Count & Yield */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-2xl p-3">
                            <div className="text-xs text-gray-500 mb-1">Plant Count</div>
                            <div className="font-bold text-gray-900">{lot.plantCount}</div>
                          </div>
                          <div className="bg-gray-50 rounded-2xl p-3">
                            <div className="text-xs text-gray-500 mb-1">Yield</div>
                            <div className="font-bold text-gray-900">
                              {lot.currentYield ? `${lot.currentYield} kg` : 'Not harvested'}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2 pt-2">
                          <Button asChild variant="outline" size="sm" className="flex-1 rounded-2xl border-2">
                            <Link href={`/plant-lots/${lot.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          {canManage && (
                            <Button asChild variant="outline" size="sm" className="flex-1 rounded-2xl border-2">
                              <Link href={`/plant-lots/${lot.id}/edit`}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Card className="border-0 shadow-lg rounded-3xl bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="rounded-2xl"
                        >
                          Previous
                        </Button>
                        <Button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          variant="outline"
                          size="sm"
                          className="rounded-2xl"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-0 shadow-xl rounded-3xl bg-white">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Plant Lots Found</h3>
                  <p className="text-gray-600 mb-6">
                    {currentPage === 1 && !selectedZone && !selectedSpecies && !selectedStatus
                      ? "You haven't created any plant lots yet."
                      : "No plant lots match the current filters."}
                  </p>
                  {canManage && currentPage === 1 && !selectedZone && !selectedSpecies && !selectedStatus && (
                    <Button asChild className="bg-green-600 hover:bg-green-700 rounded-2xl">
                      <Link href="/plant-lots/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Plant Lot
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
