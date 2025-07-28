'use client';

import { useState } from 'react';
import { healthLogsApi } from '../lib/api';
import { CreateHealthLogData, HealthStatus, HealthMetrics } from '../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Camera, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Leaf, 
  Flower, 
  Apple,
  Ruler,
  Save,
  X
} from 'lucide-react';

interface HealthReportFormProps {
  plantLotId: number;
  plantLotNumber: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const healthStatusOptions: { value: HealthStatus; label: string; color: string }[] = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-800' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'poor', label: 'Poor', color: 'bg-orange-100 text-orange-800' },
  { value: 'diseased', label: 'Diseased', color: 'bg-red-100 text-red-800' },
  { value: 'critical', label: 'Critical', color: 'bg-red-200 text-red-900' },
];

export default function HealthReportForm({ 
  plantLotId, 
  plantLotNumber, 
  onSuccess, 
  onCancel 
}: HealthReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [useLocation, setUseLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const [formData, setFormData] = useState<CreateHealthLogData>({
    plantLotId,
    healthStatus: 'good',
    notes: '',
    metrics: {},
    recordedAt: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...files].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const captureLocation = async () => {
    setLocationLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      setFormData(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }));
      setUseLocation(true);
    } catch (err) {
      console.error('Error getting location:', err);
      setError('Unable to get current location. Please ensure location permissions are granted.');
    } finally {
      setLocationLoading(false);
    }
  };

  const updateMetrics = (field: keyof HealthMetrics, value: number | undefined) => {
    setFormData(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        [field]: value === undefined || value === 0 ? undefined : value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Submitting health report with data:', formData);
      console.log('Selected images:', selectedImages);

      if (selectedImages.length > 0) {
        // Create FormData for images
        const formDataWithImages = new FormData();
        formDataWithImages.append('plantLotId', plantLotId.toString());
        formDataWithImages.append('healthStatus', formData.healthStatus);
        if (formData.notes && formData.notes.trim()) {
          formDataWithImages.append('notes', formData.notes);
        }
        if (formData.recordedAt) {
          formDataWithImages.append('recordedAt', formData.recordedAt);
        }
        if (formData.latitude) {
          formDataWithImages.append('latitude', formData.latitude.toString());
        }
        if (formData.longitude) {
          formDataWithImages.append('longitude', formData.longitude.toString());
        }
        
        // Add metrics only if there are actual values
        if (formData.metrics && Object.keys(formData.metrics).length > 0) {
          // Filter out undefined/null values
          const cleanMetrics = Object.fromEntries(
            Object.entries(formData.metrics).filter(([_, value]) => value !== undefined && value !== null)
          );
          if (Object.keys(cleanMetrics).length > 0) {
            formDataWithImages.append('metrics', JSON.stringify(cleanMetrics));
          }
        }
        
        // Add images
        selectedImages.forEach((image) => {
          formDataWithImages.append('images', image);
        });

        console.log('Calling createWithImages API...');
        await healthLogsApi.createWithImages(formDataWithImages);
      } else {
        // Create without images using regular JSON endpoint
        console.log('Calling create API without images...');
        
        // Clean the form data to remove undefined values
        const cleanFormData = {
          ...formData,
          notes: formData.notes?.trim() || undefined,
          metrics: formData.metrics && Object.keys(formData.metrics).length > 0 
            ? Object.fromEntries(
                Object.entries(formData.metrics).filter(([_, value]) => value !== undefined && value !== null)
              )
            : undefined
        };
        
        // Remove undefined fields
        Object.keys(cleanFormData).forEach(key => {
          if (cleanFormData[key as keyof typeof cleanFormData] === undefined) {
            delete cleanFormData[key as keyof typeof cleanFormData];
          }
        });

        await healthLogsApi.create(cleanFormData);
      }

      console.log('Health report saved successfully');
      onSuccess();
    } catch (err) {
      console.error('Error saving health report:', err);
      setError(err instanceof Error ? err.message : 'Failed to save health report');
    } finally {
      setLoading(false);
    }
  };

  const selectedStatusOption = healthStatusOptions.find(option => option.value === formData.healthStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0">
          <CardHeader className="bg-green-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-green-800">Add Health Report</CardTitle>
                <CardDescription>
                  Record health status and metrics for Plant Lot {plantLotNumber}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Health Status */}
              <div>
                <Label htmlFor="healthStatus" className="text-base font-medium">Health Status *</Label>
                <Select 
                  value={formData.healthStatus} 
                  onValueChange={(value: HealthStatus) => 
                    setFormData(prev => ({ ...prev, healthStatus: value }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue>
                      {selectedStatusOption && (
                        <div className="flex items-center space-x-2">
                          <Badge className={selectedStatusOption.color} variant="secondary">
                            {selectedStatusOption.label}
                          </Badge>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {healthStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center space-x-2">
                          <Badge className={option.color} variant="secondary">
                            {option.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-base font-medium">Observations & Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Describe any observations, issues, or treatments applied..."
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Plant Metrics */}
              <div>
                <Label className="text-base font-medium mb-3 block">Plant Metrics (Optional)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plantHeight" className="flex items-center space-x-1">
                      <Ruler className="h-4 w-4" />
                      <span>Height (cm)</span>
                    </Label>
                    <Input
                      id="plantHeight"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={formData.metrics?.plantHeight || ''}
                      onChange={(e) => updateMetrics('plantHeight', parseFloat(e.target.value) || undefined)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leafCount" className="flex items-center space-x-1">
                      <Leaf className="h-4 w-4" />
                      <span>Leaf Count</span>
                    </Label>
                    <Input
                      id="leafCount"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.metrics?.leafCount || ''}
                      onChange={(e) => updateMetrics('leafCount', parseInt(e.target.value) || undefined)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="flowerCount" className="flex items-center space-x-1">
                      <Flower className="h-4 w-4" />
                      <span>Flower Count</span>
                    </Label>
                    <Input
                      id="flowerCount"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.metrics?.flowerCount || ''}
                      onChange={(e) => updateMetrics('flowerCount', parseInt(e.target.value) || undefined)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fruitCount" className="flex items-center space-x-1">
                      <Apple className="h-4 w-4" />
                      <span>Fruit Count</span>
                    </Label>
                    <Input
                      id="fruitCount"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.metrics?.fruitCount || ''}
                      onChange={(e) => updateMetrics('fruitCount', parseInt(e.target.value) || undefined)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Environmental Metrics */}
              <div>
                <Label className="text-base font-medium mb-3 block">Environmental Conditions (Optional)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="temperature" className="flex items-center space-x-1">
                      <Thermometer className="h-4 w-4" />
                      <span>Temperature (°C)</span>
                    </Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="-50"
                      max="70"
                      step="0.1"
                      placeholder="25"
                      value={formData.metrics?.temperature || ''}
                      onChange={(e) => updateMetrics('temperature', parseFloat(e.target.value) || undefined)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="humidity" className="flex items-center space-x-1">
                      <Droplets className="h-4 w-4" />
                      <span>Humidity (%)</span>
                    </Label>
                    <Input
                      id="humidity"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="60"
                      value={formData.metrics?.humidity || ''}
                      onChange={(e) => updateMetrics('humidity', parseFloat(e.target.value) || undefined)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="soilMoisture" className="flex items-center space-x-1">
                      <Droplets className="h-4 w-4" />
                      <span>Soil Moisture (%)</span>
                    </Label>
                    <Input
                      id="soilMoisture"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="40"
                      value={formData.metrics?.soilMoisture || ''}
                      onChange={(e) => updateMetrics('soilMoisture', parseFloat(e.target.value) || undefined)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <Label className="text-base font-medium mb-3 block">Photos (Optional - Max 5)</Label>
                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('imageUpload')?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Add Photos</span>
                    </Button>
                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-base font-medium mb-3 block">Location (Optional)</Label>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={captureLocation}
                    disabled={locationLoading}
                    className="flex items-center space-x-2"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>{locationLoading ? 'Getting Location...' : 'Use Current Location'}</span>
                  </Button>
                  {useLocation && formData.latitude && formData.longitude && (
                    <span className="text-sm text-gray-600 flex items-center">
                      📍 {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </span>
                  )}
                </div>
              </div>

              {/* Recorded At */}
              <div>
                <Label htmlFor="recordedAt" className="text-base font-medium">Recorded At</Label>
                <Input
                  id="recordedAt"
                  type="datetime-local"
                  value={formData.recordedAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, recordedAt: e.target.value }))}
                  className="mt-2"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Health Report
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
