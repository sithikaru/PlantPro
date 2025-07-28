'use client';

import { useState, useEffect } from 'react';
import { healthLogsApi } from '../lib/api';
import { HealthLog } from '../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calendar,
  MapPin,
  Thermometer,
  Droplets,
  Leaf,
  Flower,
  Apple,
  Ruler,
  User,
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface HealthLogHistoryProps {
  plantLotId: number;
  refresh?: boolean;
  onRefreshComplete?: () => void;
}

const healthStatusColors = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-orange-100 text-orange-800',
  diseased: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
};

const analysisStatusIcons = {
  pending: <Clock className="h-4 w-4 text-yellow-600" />,
  processing: <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-green-600" />,
  failed: <AlertCircle className="h-4 w-4 text-red-600" />,
};

export default function HealthLogHistory({ 
  plantLotId, 
  refresh, 
  onRefreshComplete 
}: HealthLogHistoryProps) {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<HealthLog | null>(null);

  const fetchHealthLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const logs = await healthLogsApi.getAll(plantLotId);
      setHealthLogs(logs.sort((a, b) => 
        new Date(b.recordedAt || b.createdAt).getTime() - 
        new Date(a.recordedAt || a.createdAt).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health logs');
    } finally {
      setLoading(false);
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    }
  };

  useEffect(() => {
    fetchHealthLogs();
  }, [plantLotId]);

  useEffect(() => {
    if (refresh) {
      fetchHealthLogs();
    }
  }, [refresh]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatMetricValue = (value: number | undefined, unit: string) => {
    return value !== undefined ? `${value}${unit}` : 'N/A';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading health history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchHealthLogs} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-green-800 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Health History
              </CardTitle>
              <CardDescription>
                {healthLogs.length} health record{healthLogs.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button onClick={fetchHealthLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {healthLogs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No health records found for this plant lot.</p>
            <p className="text-sm text-gray-500 mt-2">Health reports will appear here once created.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {healthLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <Badge className={healthStatusColors[log.healthStatus]} variant="secondary">
                      {log.healthStatus.charAt(0).toUpperCase() + log.healthStatus.slice(1)}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {analysisStatusIcons[log.analysisStatus]}
                      <span className="text-sm text-gray-500 capitalize">
                        {log.analysisStatus}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(log.recordedAt || log.createdAt)}
                    </div>
                    {log.recordedBy && (
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 mr-1" />
                        {log.recordedBy.firstName} {log.recordedBy.lastName}
                      </div>
                    )}
                  </div>
                </div>

                {log.notes && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Observations</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">
                      {log.notes}
                    </p>
                  </div>
                )}

                {log.metrics && Object.keys(log.metrics).length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-3">Measurements</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {log.metrics.plantHeight !== undefined && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Ruler className="h-4 w-4 text-gray-500" />
                          <span>Height: {formatMetricValue(log.metrics.plantHeight, 'cm')}</span>
                        </div>
                      )}
                      {log.metrics.leafCount !== undefined && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Leaf className="h-4 w-4 text-gray-500" />
                          <span>Leaves: {formatMetricValue(log.metrics.leafCount, '')}</span>
                        </div>
                      )}
                      {log.metrics.flowerCount !== undefined && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Flower className="h-4 w-4 text-gray-500" />
                          <span>Flowers: {formatMetricValue(log.metrics.flowerCount, '')}</span>
                        </div>
                      )}
                      {log.metrics.fruitCount !== undefined && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Apple className="h-4 w-4 text-gray-500" />
                          <span>Fruits: {formatMetricValue(log.metrics.fruitCount, '')}</span>
                        </div>
                      )}
                      {log.metrics.temperature !== undefined && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Thermometer className="h-4 w-4 text-gray-500" />
                          <span>Temp: {formatMetricValue(log.metrics.temperature, '°C')}</span>
                        </div>
                      )}
                      {log.metrics.humidity !== undefined && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Droplets className="h-4 w-4 text-gray-500" />
                          <span>Humidity: {formatMetricValue(log.metrics.humidity, '%')}</span>
                        </div>
                      )}
                      {log.metrics.soilMoisture !== undefined && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Droplets className="h-4 w-4 text-gray-500" />
                          <span>Soil: {formatMetricValue(log.metrics.soilMoisture, '%')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {log.images && log.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                      <Camera className="h-4 w-4 mr-2" />
                      Photos ({log.images.length})
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {log.images.slice(0, 4).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Health log ${log.id} - Image ${index + 1}`}
                          className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                          onClick={() => setSelectedLog(log)}
                        />
                      ))}
                      {log.images.length > 4 && (
                        <div 
                          className="w-full h-16 bg-gray-100 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-200"
                          onClick={() => setSelectedLog(log)}
                        >
                          <span className="text-xs text-gray-600">+{log.images.length - 4} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {log.latitude && log.longitude && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Location: {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)}
                    </span>
                  </div>
                )}

                {log.aiAnalysis && log.analysisStatus === 'completed' && (
                  <div className="mt-4 bg-blue-50 p-3 rounded">
                    <h4 className="font-medium text-blue-800 mb-2">AI Analysis Results</h4>
                    <div className="space-y-2 text-sm">
                      {log.aiAnalysis.healthScore !== undefined && (
                        <div>
                          <strong>Health Score:</strong> {log.aiAnalysis.healthScore}/100
                        </div>
                      )}
                      {log.aiAnalysis.diseaseDetected && (
                        <div>
                          <strong>Disease Detected:</strong> {log.aiAnalysis.diseaseType || 'Unknown'} 
                          {log.aiAnalysis.confidence && ` (${Math.round(log.aiAnalysis.confidence * 100)}% confidence)`}
                        </div>
                      )}
                      {log.aiAnalysis.recommendations && log.aiAnalysis.recommendations.length > 0 && (
                        <div>
                          <strong>Recommendations:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {log.aiAnalysis.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedLog && selectedLog.images && selectedLog.images.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Health Log Images - {formatDate(selectedLog.recordedAt || selectedLog.createdAt)}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  ✕
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedLog.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Health log ${selectedLog.id} - Image ${index + 1}`}
                    className="w-full h-auto rounded border"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
