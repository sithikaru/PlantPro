'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Save } from 'lucide-react';
import { PlantSpecies } from '../lib/types';

interface SpeciesFormProps {
  species?: PlantSpecies | null;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

export default function SpeciesForm({ species, onSubmit, onClose }: SpeciesFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    description: '',
    growthPeriodDays: '',
    harvestPeriodDays: '',
    expectedYieldPerPlant: '',
    yieldUnit: '',
    temperatureMin: '',
    temperatureMax: '',
    humidityMin: '',
    humidityMax: '',
    soilPHMin: '',
    soilPHMax: '',
    sunlight: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (species) {
      setFormData({
        name: species.name || '',
        scientificName: species.scientificName || '',
        description: species.description || '',
        growthPeriodDays: species.growthPeriodDays?.toString() || '',
        harvestPeriodDays: species.harvestPeriodDays?.toString() || '',
        expectedYieldPerPlant: species.expectedYieldPerPlant?.toString() || '',
        yieldUnit: species.yieldUnit || '',
        temperatureMin: species.optimalConditions?.temperature?.min?.toString() || '',
        temperatureMax: species.optimalConditions?.temperature?.max?.toString() || '',
        humidityMin: species.optimalConditions?.humidity?.min?.toString() || '',
        humidityMax: species.optimalConditions?.humidity?.max?.toString() || '',
        soilPHMin: species.optimalConditions?.soilPH?.min?.toString() || '',
        soilPHMax: species.optimalConditions?.soilPH?.max?.toString() || '',
        sunlight: species.optimalConditions?.sunlight || '',
        isActive: species.isActive ?? true,
      });
    }
  }, [species]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Species name is required';
    }

    if (!formData.scientificName.trim()) {
      newErrors.scientificName = 'Scientific name is required';
    }

    if (!formData.growthPeriodDays || isNaN(Number(formData.growthPeriodDays))) {
      newErrors.growthPeriodDays = 'Growth period must be a valid number';
    }

    if (!formData.harvestPeriodDays || isNaN(Number(formData.harvestPeriodDays))) {
      newErrors.harvestPeriodDays = 'Harvest period must be a valid number';
    }

    if (!formData.expectedYieldPerPlant || isNaN(Number(formData.expectedYieldPerPlant))) {
      newErrors.expectedYieldPerPlant = 'Expected yield must be a valid number';
    }

    if (!formData.yieldUnit.trim()) {
      newErrors.yieldUnit = 'Yield unit is required';
    }

    if (formData.temperatureMin && isNaN(Number(formData.temperatureMin))) {
      newErrors.temperatureMin = 'Temperature must be a number';
    }

    if (formData.temperatureMax && isNaN(Number(formData.temperatureMax))) {
      newErrors.temperatureMax = 'Temperature must be a number';
    }

    if (formData.humidityMin && isNaN(Number(formData.humidityMin))) {
      newErrors.humidityMin = 'Humidity must be a number';
    }

    if (formData.humidityMax && isNaN(Number(formData.humidityMax))) {
      newErrors.humidityMax = 'Humidity must be a number';
    }

    if (formData.soilPHMin && isNaN(Number(formData.soilPHMin))) {
      newErrors.soilPHMin = 'Soil pH must be a number';
    }

    if (formData.soilPHMax && isNaN(Number(formData.soilPHMax))) {
      newErrors.soilPHMax = 'Soil pH must be a number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        scientificName: formData.scientificName.trim(),
        description: formData.description.trim() || undefined,
        growthPeriodDays: Number(formData.growthPeriodDays),
        harvestPeriodDays: Number(formData.harvestPeriodDays),
        expectedYieldPerPlant: Number(formData.expectedYieldPerPlant),
        yieldUnit: formData.yieldUnit.trim(),
        optimalConditions: {
          temperature: formData.temperatureMin || formData.temperatureMax ? {
            min: formData.temperatureMin ? Number(formData.temperatureMin) : undefined,
            max: formData.temperatureMax ? Number(formData.temperatureMax) : undefined,
          } : undefined,
          humidity: formData.humidityMin || formData.humidityMax ? {
            min: formData.humidityMin ? Number(formData.humidityMin) : undefined,
            max: formData.humidityMax ? Number(formData.humidityMax) : undefined,
          } : undefined,
          soilPH: formData.soilPHMin || formData.soilPHMax ? {
            min: formData.soilPHMin ? Number(formData.soilPHMin) : undefined,
            max: formData.soilPHMax ? Number(formData.soilPHMax) : undefined,
          } : undefined,
          sunlight: formData.sunlight.trim() || undefined,
        },
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            {species ? 'Edit Species' : 'Add New Species'}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Species Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Tomato, Lettuce"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scientific Name *
                  </label>
                  <input
                    type="text"
                    value={formData.scientificName}
                    onChange={(e) => handleChange('scientificName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.scientificName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Solanum lycopersicum"
                  />
                  {errors.scientificName && <p className="text-red-500 text-xs mt-1">{errors.scientificName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Brief description of the species..."
                />
              </div>
            </div>

            {/* Growth Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Growth & Harvest</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Growth Period (days) *
                  </label>
                  <input
                    type="number"
                    value={formData.growthPeriodDays}
                    onChange={(e) => handleChange('growthPeriodDays', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.growthPeriodDays ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="90"
                  />
                  {errors.growthPeriodDays && <p className="text-red-500 text-xs mt-1">{errors.growthPeriodDays}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harvest Period (days) *
                  </label>
                  <input
                    type="number"
                    value={formData.harvestPeriodDays}
                    onChange={(e) => handleChange('harvestPeriodDays', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.harvestPeriodDays ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="30"
                  />
                  {errors.harvestPeriodDays && <p className="text-red-500 text-xs mt-1">{errors.harvestPeriodDays}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Yield Per Plant *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.expectedYieldPerPlant}
                    onChange={(e) => handleChange('expectedYieldPerPlant', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.expectedYieldPerPlant ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="5.5"
                  />
                  {errors.expectedYieldPerPlant && <p className="text-red-500 text-xs mt-1">{errors.expectedYieldPerPlant}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yield Unit *
                  </label>
                  <select
                    value={formData.yieldUnit}
                    onChange={(e) => handleChange('yieldUnit', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      errors.yieldUnit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select unit</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="lb">Pound (lb)</option>
                    <option value="oz">Ounce (oz)</option>
                    <option value="tons">Tons</option>
                    <option value="pieces">Pieces</option>
                  </select>
                  {errors.yieldUnit && <p className="text-red-500 text-xs mt-1">{errors.yieldUnit}</p>}
                </div>
              </div>
            </div>

            {/* Optimal Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Optimal Growing Conditions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperatureMin}
                      onChange={(e) => handleChange('temperatureMin', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.temperatureMin ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="18"
                    />
                    {errors.temperatureMin && <p className="text-red-500 text-xs mt-1">{errors.temperatureMin}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperatureMax}
                      onChange={(e) => handleChange('temperatureMax', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.temperatureMax ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="25"
                    />
                    {errors.temperatureMax && <p className="text-red-500 text-xs mt-1">{errors.temperatureMax}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Humidity (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.humidityMin}
                      onChange={(e) => handleChange('humidityMin', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.humidityMin ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="60"
                    />
                    {errors.humidityMin && <p className="text-red-500 text-xs mt-1">{errors.humidityMin}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Humidity (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.humidityMax}
                      onChange={(e) => handleChange('humidityMax', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.humidityMax ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="80"
                    />
                    {errors.humidityMax && <p className="text-red-500 text-xs mt-1">{errors.humidityMax}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Soil pH
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.soilPHMin}
                      onChange={(e) => handleChange('soilPHMin', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.soilPHMin ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="6.0"
                    />
                    {errors.soilPHMin && <p className="text-red-500 text-xs mt-1">{errors.soilPHMin}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Soil pH
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.soilPHMax}
                      onChange={(e) => handleChange('soilPHMax', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.soilPHMax ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="7.0"
                    />
                    {errors.soilPHMax && <p className="text-red-500 text-xs mt-1">{errors.soilPHMax}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sunlight Requirements
                  </label>
                  <select
                    value={formData.sunlight}
                    onChange={(e) => handleChange('sunlight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select sunlight requirement</option>
                    <option value="Full sun">Full sun (6+ hours direct sunlight)</option>
                    <option value="Partial sun">Partial sun (3-6 hours direct sunlight)</option>
                    <option value="Partial shade">Partial shade (3-6 hours indirect sunlight)</option>
                    <option value="Full shade">Full shade (less than 3 hours sunlight)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {species ? 'Update Species' : 'Add Species'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
