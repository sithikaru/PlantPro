'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  ChevronRight,
  Leaf,
  MapPin
} from 'lucide-react';
import { PlantSpecies, Zone } from '../../lib/types';
import { plantSpeciesApi, zonesApi } from '../../lib/api';
import SpeciesForm from '../../components/SpeciesForm';
import ZoneForm from '../../components/ZoneForm';

export default function SpeciesZonesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('species');
  const [species, setSpecies] = useState<PlantSpecies[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [showSpeciesForm, setShowSpeciesForm] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [editingSpecies, setEditingSpecies] = useState<PlantSpecies | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [speciesData, zonesData] = await Promise.all([
        plantSpeciesApi.getAll(),
        zonesApi.getAll(),
      ]);
      setSpecies(speciesData);
      setZones(zonesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeciesSubmit = async (data: any) => {
    try {
      if (editingSpecies) {
        await plantSpeciesApi.update(editingSpecies.id, data);
      } else {
        await plantSpeciesApi.create(data);
      }
      await loadData();
      setShowSpeciesForm(false);
      setEditingSpecies(null);
    } catch (error) {
      console.error('Error saving species:', error);
      throw error;
    }
  };

  const handleZoneSubmit = async (data: any) => {
    try {
      if (editingZone) {
        await zonesApi.update(editingZone.id, data);
      } else {
        await zonesApi.create(data);
      }
      await loadData();
      setShowZoneForm(false);
      setEditingZone(null);
    } catch (error) {
      console.error('Error saving zone:', error);
      throw error;
    }
  };

  const handleDeleteSpecies = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this species?')) {
      try {
        await plantSpeciesApi.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting species:', error);
      }
    }
  };

  const handleDeleteZone = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this zone?')) {
      try {
        await zonesApi.delete(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting zone:', error);
      }
    }
  };

  const filteredSpecies = species.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.scientificName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (zone.description && zone.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Species & Zones Management</h1>
            <p className="text-gray-600 mt-1">Manage plant species and growing zones</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="species" className="flex items-center gap-2">
              <Leaf className="h-4 w-4" />
              Plant Species ({species.length})
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Zones ({zones.length})
            </TabsTrigger>
          </TabsList>

          {/* Species Tab */}
          <TabsContent value="species" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search species..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  setEditingSpecies(null);
                  setShowSpeciesForm(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Species
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSpecies.map((speciesItem) => (
                <Card key={speciesItem.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{speciesItem.name}</CardTitle>
                        <CardDescription className="text-sm italic">
                          {speciesItem.scientificName}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {speciesItem.yieldUnit}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {speciesItem.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {speciesItem.description}
                        </p>
                      )}
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Growth: {speciesItem.growthPeriodDays} days</div>
                        <div>Harvest: {speciesItem.harvestPeriodDays} days</div>
                        <div>Yield: {speciesItem.expectedYieldPerPlant} {speciesItem.yieldUnit}/plant</div>
                        {speciesItem.optimalConditions?.temperature && (
                          <div>
                            Temp: {speciesItem.optimalConditions.temperature.min}°C - {speciesItem.optimalConditions.temperature.max}°C
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSpecies(speciesItem);
                            setShowSpeciesForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSpecies(speciesItem.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSpecies.length === 0 && (
              <div className="text-center py-12">
                <Leaf className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No species found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first plant species.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search zones..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={() => {
                  setEditingZone(null);
                  setShowZoneForm(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Zone
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZones.map((zone) => (
                <Card key={zone.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {zone.areaHectares} hectares
                        </CardDescription>
                      </div>
                      <Badge variant={zone.isActive ? "default" : "secondary"}>
                        {zone.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {zone.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {zone.description}
                        </p>
                      )}
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {zone.coordinates && (
                          <div>
                            Coordinates: {zone.coordinates.latitude}, {zone.coordinates.longitude}
                          </div>
                        )}
                        <div>Area: {zone.areaHectares} hectares</div>
                        <div>Status: {zone.isActive ? 'Active' : 'Inactive'}</div>
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingZone(zone);
                            setShowZoneForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteZone(zone.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredZones.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No zones found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first growing zone.'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Forms */}
        {showSpeciesForm && (
          <SpeciesForm
            species={editingSpecies}
            onSubmit={handleSpeciesSubmit}
            onClose={() => {
              setShowSpeciesForm(false);
              setEditingSpecies(null);
            }}
          />
        )}

        {showZoneForm && (
          <ZoneForm
            zone={editingZone}
            onSubmit={handleZoneSubmit}
            onClose={() => {
              setShowZoneForm(false);
              setEditingZone(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
