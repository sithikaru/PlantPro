'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { healthLogsApi, plantLotsApi } from '../../../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ArrowLeft, BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface HealthLogsPageProps {
  params: Promise<{
    params: string[];
  }>;
}

function HealthLogsPageClient({ plantLotId }: { plantLotId: number }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plantLot, setPlantLot] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [historicalAnalytics, setHistoricalAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && plantLotId) {
      fetchData();
    }
  }, [isAuthenticated, plantLotId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch plant lot data and analytics in parallel
      const [lotData, analyticsData, historicalData] = await Promise.all([
        plantLotsApi.getById(plantLotId),
        healthLogsApi.getAnalytics(plantLotId),
        healthLogsApi.getHistoricalAnalytics(plantLotId).catch(() => null), // Don't fail if no historical data
      ]);

      setPlantLot(lotData);
      setAnalytics(analyticsData);
      setHistoricalAnalytics(historicalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAnalysis = async () => {
    try {
      setAnalyzing(true);
      const result = await healthLogsApi.triggerAnalysis(plantLotId);
      
      // Refresh data after analysis
      await fetchData();
      
      alert('AI analysis completed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const getHealthStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthStatusIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!plantLot) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Plant Lot Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link href={`/plant-lots/${plantLotId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Plant Lot
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Health Analytics</h1>
              <p className="text-gray-600">{plantLot.species} - Zone {plantLot.zone}</p>
            </div>
          </div>
          <Button 
            onClick={handleTriggerAnalysis} 
            disabled={analyzing}
            className="bg-green-600 hover:bg-green-700"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Current Health Status */}
      {historicalAnalytics?.currentHealthStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Health Score</CardTitle>
              {getHealthStatusIcon(historicalAnalytics.currentHealthStatus.healthScore)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthStatusColor(historicalAnalytics.currentHealthStatus.healthScore)}`}>
                {historicalAnalytics.currentHealthStatus.healthScore}/100
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                Status: {historicalAnalytics.currentHealthStatus.status}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Trend</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {historicalAnalytics.historicalComparison.trendDirection === 'improving' && '↗️'}
                {historicalAnalytics.historicalComparison.trendDirection === 'declining' && '↘️'}
                {historicalAnalytics.historicalComparison.trendDirection === 'stable' && '➡️'}
                {Math.abs(historicalAnalytics.historicalComparison.percentageChange).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {historicalAnalytics.historicalComparison.trendDirection} over {historicalAnalytics.historicalComparison.comparisonPeriod}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disease Detection Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {historicalAnalytics.diseaseFrequencyAnalysis.diseaseDetectionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Risk trend: {historicalAnalytics.diseaseFrequencyAnalysis.riskTrend}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {historicalAnalytics?.alerts && historicalAnalytics.alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Alerts & Notifications</h2>
          <div className="space-y-3">
            {historicalAnalytics.alerts.map((alert: any, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-700' :
                  'bg-blue-50 border-blue-400 text-blue-700'
                }`}
              >
                <div className="flex items-center">
                  {alert.type === 'error' && <AlertTriangle className="h-5 w-5 mr-2" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 mr-2" />}
                  {alert.type === 'info' && <CheckCircle className="h-5 w-5 mr-2" />}
                  <span className="font-medium">{alert.message}</span>
                  <span className={`ml-auto text-xs px-2 py-1 rounded ${
                    alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                    alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {alert.priority} priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {historicalAnalytics?.recommendations && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Immediate Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {historicalAnalytics.recommendations.immediate.map((rec: string, index: number) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">Short-term (1-4 weeks)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {historicalAnalytics.recommendations.shortTerm.map((rec: string, index: number) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Long-term (1-3 months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {historicalAnalytics.recommendations.longTerm.map((rec: string, index: number) => (
                    <li key={index} className="text-sm flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Health Trends Chart */}
      {historicalAnalytics?.healthTrends && historicalAnalytics.healthTrends.length > 0 && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Health Score Trend (Last 30 Days)</CardTitle>
              <CardDescription>
                Track your plant lot's health progression over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end space-x-2">
                {historicalAnalytics.healthTrends.map((trend: any, index: number) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-t ${getHealthStatusColor(trend.healthScore).replace('text-', 'bg-')}`}
                      style={{ height: `${(trend.healthScore / 100) * 200}px` }}
                    ></div>
                    <div className="text-xs mt-2 transform -rotate-45">
                      {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Environmental Trends */}
      {historicalAnalytics?.environmentalTrends && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Environmental Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Temperature</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {historicalAnalytics.environmentalTrends.temperatureAverage.toFixed(1)}°C
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  Trend: {historicalAnalytics.environmentalTrends.temperatureTrend}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Humidity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {historicalAnalytics.environmentalTrends.humidityAverage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  Trend: {historicalAnalytics.environmentalTrends.humidityTrend}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Soil Moisture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {historicalAnalytics.environmentalTrends.soilMoistureAverage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground capitalize">
                  Trend: {historicalAnalytics.environmentalTrends.soilMoistureTrend}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Navigation to Health Logs */}
      <div className="text-center">
        <Link href={`/plant-lots/${plantLotId}/health-log`}>
          <Button variant="outline" size="lg">
            View All Health Logs
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function HealthLogsPage({ params }: HealthLogsPageProps) {
  const [plantLotId, setPlantLotId] = useState<number | null>(null);

  useEffect(() => {
    params.then(({ params: routeParams }) => {
      // Parse the route params to extract plantLotId
      // Expected format: /health-logs/na/plantLotId=1
      const plantLotParam = routeParams.find(param => param.startsWith('plantLotId='));
      if (plantLotParam) {
        const id = parseInt(plantLotParam.split('=')[1], 10);
        if (!isNaN(id)) {
          setPlantLotId(id);
        }
      }
    });
  }, [params]);

  if (plantLotId === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return <HealthLogsPageClient plantLotId={plantLotId} />;
}
