'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi } from '../../../../lib/api';
import { PlantLot } from '../../../../lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { ArrowLeft, Plus, TrendingUp } from 'lucide-react';
import HealthReportForm from '../../../../components/health-report-form';
import HealthLogHistory from '../../../../components/health-log-history';

interface HealthLogPageProps {
  params: Promise<{
    id: string;
  }>;
}

function HealthLogPageClient({ lotId }: { lotId: number }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [plantLot, setPlantLot] = useState<PlantLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && lotId) {
      fetchPlantLot();
    }
  }, [isAuthenticated, lotId]);

  const fetchPlantLot = async () => {
    try {
      setLoading(true);
      setError(null);
      const lot = await plantLotsApi.getById(lotId);
      setPlantLot(lot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plant lot');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthReportSuccess = () => {
    setShowHealthForm(false);
    setRefreshTrigger(prev => prev + 1);
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
        <div className="flex items-center space-x-4 mb-4">
          <Link href={`/plant-lots/${lotId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plant Lot
            </Button>
          </Link>
        </div>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Health Logs for Lot #{plantLot.lotNumber}
            </h1>
            <p className="text-gray-600">
              {plantLot.species?.name} • {plantLot.zone?.name}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Link href={`/health-logs/na/plantLotId=${plantLot.id}`}>
              <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analyze Health
              </Button>
            </Link>
            <Button
              onClick={() => setShowHealthForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Health Report
            </Button>
          </div>
        </div>
      </div>

      {/* Plant Lot Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span>Plant Lot Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plant Count</p>
              <p className="text-lg font-semibold">{plantLot.plantCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold capitalize">{plantLot.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Plant Date</p>
              <p className="text-lg font-semibold">
                {new Date(plantLot.plantedDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expected Harvest</p>
              <p className="text-lg font-semibold">
                {plantLot.expectedHarvestDate 
                  ? new Date(plantLot.expectedHarvestDate).toLocaleDateString()
                  : 'Not set'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Logs History */}
      <HealthLogHistory 
        plantLotId={lotId} 
        refresh={refreshTrigger > 0}
        onRefreshComplete={() => setRefreshTrigger(0)}
      />

      {/* Health Report Form Modal */}
      {showHealthForm && (
        <HealthReportForm
          plantLotId={lotId}
          plantLotNumber={plantLot.lotNumber}
          onSuccess={handleHealthReportSuccess}
          onCancel={() => setShowHealthForm(false)}
        />
      )}
    </div>
  );
}

export default function HealthLogPage({ params }: HealthLogPageProps) {
  const [lotId, setLotId] = useState<number | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        setLotId(numericId);
      }
    });
  }, [params]);

  if (lotId === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return <HealthLogPageClient lotId={lotId} />;
}
