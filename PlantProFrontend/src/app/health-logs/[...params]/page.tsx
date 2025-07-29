"use client";
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

  // Debug information
  useEffect(() => {
    console.log('HealthLogsPageClient mounted with plantLotId:', plantLotId);
    console.log('Auth state:', { user, isAuthenticated, authLoading });
  }, [plantLotId, user, isAuthenticated, authLoading]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && plantLotId) {
      console.log('Starting data fetch for authenticated user');
      fetchData();
    }
  }, [isAuthenticated, plantLotId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data for plant lot ID:', plantLotId);
      
      // Fetch plant lot data first
      console.log('Fetching plant lot data...');
      const lotData = await plantLotsApi.getById(plantLotId);
      console.log('Plant lot data received:', lotData);
      setPlantLot(lotData);
      
      // Then fetch analytics
      console.log('Fetching analytics...');
      const analyticsData = await healthLogsApi.getAnalytics(plantLotId);
      console.log('Analytics data received:', analyticsData);
      setAnalytics(analyticsData);
      
      // Finally fetch historical data (optional)
      console.log('Fetching historical analytics...');
      try {
        const historicalData = await healthLogsApi.getHistoricalAnalytics(plantLotId);
        console.log('Historical analytics data received:', historicalData);
        setHistoricalAnalytics(historicalData);
      } catch (historicalError) {
        console.warn('Failed to fetch historical analytics:', historicalError);
        setHistoricalAnalytics(null);
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
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

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access this page.</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading plant lot data...</span>
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
          <div className="space-x-4">
            <Button onClick={fetchData}>Retry</Button>
            <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
          </div>
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
      {/* Debug Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Plant Lot ID:</strong> {plantLotId}</p>
            <p><strong>User:</strong> {user?.email || 'Not logged in'}</p>
            <p><strong>Plant Lot:</strong> {plantLot ? 'Loaded' : 'Not loaded'}</p>
            <p><strong>Analytics:</strong> {analytics ? 'Loaded' : 'Not loaded'}</p>
            <p><strong>Historical Analytics:</strong> {historicalAnalytics ? 'Loaded' : 'Not loaded'}</p>
          </div>
        </CardContent>
      </Card>

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
              <p className="text-gray-600">{plantLot.species?.name} - Zone {plantLot.zone?.name}</p>
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

      {/* Basic Plant Lot Info */}
      {plantLot && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Plant Lot Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Lot Number:</p>
                <p>{plantLot.lotNumber}</p>
              </div>
              <div>
                <p className="font-semibold">Species:</p>
                <p>{plantLot.species?.name}</p>
              </div>
              <div>
                <p className="font-semibold">Plant Count:</p>
                <p>{plantLot.plantCount}</p>
              </div>
              <div>
                <p className="font-semibold">Status:</p>
                <p className="capitalize">{plantLot.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Data */}
      {analytics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Total Logs:</strong> {analytics.totalLogs}</p>
              <p><strong>Average Health Score:</strong> {analytics.averageHealthScore}</p>
              <p><strong>Recent Logs (30 days):</strong> {analytics.recentLogs}</p>
              <p><strong>Disease Detection Rate:</strong> {(analytics.diseaseDetectionRate * 100).toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Analytics Data */}
      {historicalAnalytics && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Historical Analytics Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Current Health Score:</p>
                <p className="text-2xl">{historicalAnalytics.currentHealthStatus?.healthScore}/100</p>
                <p className="text-sm text-gray-600 capitalize">{historicalAnalytics.currentHealthStatus?.status}</p>
              </div>
              <div>
                <p className="font-semibold">Health Trend:</p>
                <p className="capitalize">{historicalAnalytics.historicalComparison?.trendDirection} ({historicalAnalytics.historicalComparison?.percentageChange.toFixed(1)}%)</p>
              </div>
              <div>
                <p className="font-semibold">Environmental Conditions:</p>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="text-sm">Temperature: {historicalAnalytics.environmentalTrends?.temperatureAverage.toFixed(1)}°C</p>
                  </div>
                  <div>
                    <p className="text-sm">Humidity: {historicalAnalytics.environmentalTrends?.humidityAverage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm">Soil: {historicalAnalytics.environmentalTrends?.soilMoistureAverage.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              {historicalAnalytics.alerts && historicalAnalytics.alerts.length > 0 && (
                <div>
                  <p className="font-semibold">Active Alerts:</p>
                  <div className="space-y-1">
                    {historicalAnalytics.alerts.map((alert: any, index: number) => (
                      <div key={index} className={`text-sm p-2 rounded ${
                        alert.type === 'error' ? 'bg-red-100 text-red-800' :
                        alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        <span className="font-medium">{alert.priority.toUpperCase()}:</span> {alert.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="text-center">
        <Link href={`/plant-lots/${plantLotId}/health-log`}>
          <Button variant="outline" size="lg">
            View All Health Logs
          </Button>
        </Link>
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
  const [paramError, setParamError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ params: routeParams }) => {
      console.log('Route params received:', routeParams);
      
      // Parse the route params to extract plantLotId
      // New format: /health-logs/analytics/1
      // routeParams would be ['analytics', '1']
      // Old format: /health-logs/na/plantLotId=1  
      // routeParams would be ['na', 'plantLotId=1']
      
      if (routeParams && routeParams.length >= 2) {
        let foundId = null;
        
        // Check new format: ['analytics', '1']
        if (routeParams[0] === 'analytics') {
          const id = parseInt(routeParams[1], 10);
          if (!isNaN(id)) {
            console.log('Found plantLotId in new format:', id);
            foundId = id;
          }
        }
        
        // If not found, check old format: ['na', 'plantLotId=1']
        if (!foundId) {
          for (const param of routeParams) {
            if (param.startsWith('plantLotId=')) {
              const id = parseInt(param.split('=')[1], 10);
              console.log('Found plantLotId in old format:', param, 'parsed as:', id);
              if (!isNaN(id)) {
                foundId = id;
                break;
              }
            }
          }
        }
        
        // Last resort: try the second parameter as direct ID
        if (!foundId && routeParams.length >= 2) {
          const potentialId = parseInt(routeParams[1], 10);
          if (!isNaN(potentialId)) {
            console.log('Using second parameter as ID:', potentialId);
            foundId = potentialId;
          }
        }
        
        if (foundId) {
          setPlantLotId(foundId);
        } else {
          console.log('Could not extract valid plant lot ID from params:', routeParams);
          setParamError('Could not extract valid plant lot ID from URL');
        }
      } else {
        console.log('Insufficient parameters in route:', routeParams);
        setParamError('Insufficient parameters in URL');
      }
    }).catch(error => {
      console.error('Error parsing params:', error);
      setParamError('Failed to parse route parameters');
    });
  }, [params]);

  if (paramError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Parameter Error</h1>
          <p className="text-gray-600 mb-4">{paramError}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (plantLotId === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return <HealthLogsPageClient plantLotId={plantLotId} />;
}
