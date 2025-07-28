'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi } from '../../lib/api';
import { PlantLot } from '../../lib/types';
import jsQR from 'jsqr';
import HealthReportForm from '../../components/health-report-form';
import HealthLogHistory from '../../components/health-log-history';
import AppLayout from '../../components/AppLayout';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Camera, 
  CameraOff, 
  Scan, 
  Leaf, 
  Activity, 
  Plus, 
  Search,
  Eye,
  Edit3,
  RefreshCw
} from 'lucide-react';

export default function QRScannerPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [plantLot, setPlantLot] = useState<PlantLot | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Continuous scanning effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (scanning && !plantLot) {
      intervalId = setInterval(() => {
        captureFrame();
      }, 100); // Check for QR codes every 100ms
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [scanning, plantLot]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setScanning(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
      setCameraSupported(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Use jsQR to detect QR codes in the frame
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (code) {
      handleQRCodeDetected(code.data);
    }
  };

  const handleQRCodeDetected = async (qrCode: string) => {
    try {
      setScannedCode(qrCode);
      setError(null);
      
      // Try to parse the QR code as JSON first (new format)
      try {
        const qrData = JSON.parse(qrCode);
        
        // First try to use the stored QR code for lookup (most reliable)
        if (qrData.qrCode) {
          try {
            const lot = await plantLotsApi.getByQrCode(qrData.qrCode);
            setPlantLot(lot);
            stopCamera();
            return;
          } catch (qrCodeError) {
            // If QR code lookup fails, fall back to lot ID
            console.log('QR code lookup failed, trying lot ID');
          }
        }
        
        // Fallback to lot ID if QR code lookup failed
        if (qrData.lotId) {
          const lot = await plantLotsApi.getById(qrData.lotId);
          setPlantLot(lot);
          stopCamera();
          return;
        }
      } catch (parseError) {
        // Not JSON, try as plain QR code string (old format)
      }
      
      // Try to find the plant lot by QR code string (fallback for old format)
      const lot = await plantLotsApi.getByQrCode(qrCode);
      setPlantLot(lot);
      stopCamera();
    } catch (err: unknown) {
      setError(`QR code "${qrCode}" not found in database. This might be an invalid or unregistered plant lot.`);
    }
  };

  const handleManualEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const manualCode = formData.get('manualCode') as string;
    
    if (manualCode.trim()) {
      await handleQRCodeDetected(manualCode.trim());
    }
  };

  const resetScanner = () => {
    setScannedCode(null);
    setPlantLot(null);
    setError(null);
    setShowHealthForm(false);
    setRefreshHistory(false);
  };

  const handleHealthReportSuccess = () => {
    setShowHealthForm(false);
    setRefreshHistory(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96 border-0 shadow-xl rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
              <p className="mt-6 text-gray-600 font-medium">Loading QR Scanner...</p>
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
    <AppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-6">
                <h1 className="text-2xl font-bold text-gray-900 font-['Inter'] tracking-tight">
                  QR Scanner
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto py-12 px-6 lg:px-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-3 font-['Inter'] tracking-tight">
                QR Code Scanner
              </h2>
              <p className="text-xl text-gray-600 font-light leading-relaxed">
                Scan QR codes to quickly access plant lot information and health reports
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

          {!plantLot ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Camera Scanner */}
              <Card className="border-0 shadow-xl rounded-3xl bg-white">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                    <Camera className="mr-3 h-6 w-6 text-blue-600" />
                    Camera Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {cameraSupported ? (
                    <div className="space-y-6">
                      <div className="relative aspect-square bg-gray-900 rounded-3xl overflow-hidden shadow-inner">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                          style={{ display: scanning ? 'block' : 'none' }}
                        />
                        <canvas
                          ref={canvasRef}
                          className="hidden"
                        />
                        
                        {!scanning && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                              <div className="w-20 h-20 mx-auto mb-6 border-3 border-white rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-sm">
                                <Camera className="w-10 h-10" />
                              </div>
                              <p className="text-lg font-medium">Camera Ready</p>
                              <p className="text-sm text-gray-300 mt-2">Tap start to begin scanning</p>
                            </div>
                          </div>
                        )}

                        {scanning && (
                          <div className="absolute inset-0">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div className="w-48 h-48 border-4 border-green-400 rounded-2xl bg-transparent shadow-lg">
                                <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-xl"></div>
                                <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-xl"></div>
                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-xl"></div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-xl"></div>
                              </div>
                            </div>
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                              <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                  <span>Scanning for QR codes...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-4">
                        {!scanning ? (
                          <Button
                            onClick={startCamera}
                            className="flex-1 bg-green-600 hover:bg-green-700 rounded-2xl h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Camera className="mr-2 h-5 w-5" />
                            Start Camera
                          </Button>
                        ) : (
                          <>
                            <Button
                              onClick={captureFrame}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Scan className="mr-2 h-5 w-5" />
                              Scan QR Code
                            </Button>
                            <Button
                              onClick={stopCamera}
                              variant="outline"
                              className="rounded-2xl h-12 px-6 border-2 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <CameraOff className="mr-2 h-4 w-4" />
                              Stop
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CameraOff className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Not Available</h3>
                      <p className="text-gray-600 mb-4">Unable to access camera on this device</p>
                      <p className="text-sm text-gray-500">Please use manual entry instead</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Manual Entry */}
              <Card className="border-0 shadow-xl rounded-3xl bg-white">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                    <Search className="mr-3 h-6 w-6 text-purple-600" />
                    Manual Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleManualEntry} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="manualCode" className="text-gray-700 font-medium text-sm">
                        Enter QR Code
                      </Label>
                      <Input
                        type="text"
                        id="manualCode"
                        name="manualCode"
                        placeholder="e.g., PLT-ABC123XYZ"
                        className="h-12 rounded-2xl border-2 border-gray-200 focus:border-green-500 focus:ring-0"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 rounded-2xl h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Search className="mr-2 h-5 w-5" />
                      Look Up Plant Lot
                    </Button>
                  </form>

                  <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <Activity className="mr-2 h-4 w-4 text-blue-600" />
                      Instructions
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Point camera at QR code and tap "Scan QR Code"</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span>Or manually type/paste the QR code text above</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span>QR codes are usually in format: PLT-XXXXXXXXX</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Plant Lot Details with Health Report */
            <div className="space-y-8">
              <Card className="border-0 shadow-xl rounded-3xl bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader className="pb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                        <Leaf className="mr-3 h-6 w-6 text-green-600" />
                        Plant Lot Found
                      </CardTitle>
                      <p className="text-sm text-green-600 font-medium">QR Code: {scannedCode}</p>
                    </div>
                    <Button
                      onClick={resetScanner}
                      variant="outline"
                      className="rounded-2xl border-2 border-gray-200 hover:bg-gray-50"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Scan Another
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="text-sm text-green-600 font-medium mb-1">Lot Number</div>
                      <div className="font-bold text-gray-900">{plantLot.lotNumber}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="text-sm text-green-600 font-medium mb-1">Status</div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${{
                        'seedling': 'bg-yellow-100 text-yellow-800',
                        'growing': 'bg-green-100 text-green-800',
                        'mature': 'bg-blue-100 text-blue-800',
                        'harvesting': 'bg-purple-100 text-purple-800',
                        'harvested': 'bg-gray-100 text-gray-800',
                        'diseased': 'bg-red-100 text-red-800',
                        'dead': 'bg-black text-white',
                      }[plantLot.status] || 'bg-gray-100 text-gray-800'}`}>
                        {plantLot.status}
                      </span>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="text-sm text-green-600 font-medium mb-1">Species</div>
                      <div className="font-bold text-gray-900">
                        {plantLot.species?.name || `Species ID: ${plantLot.speciesId}`}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="text-sm text-green-600 font-medium mb-1">Zone</div>
                      <div className="font-bold text-gray-900">
                        {plantLot.zone?.name || `Zone ID: ${plantLot.zoneId}`}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="text-sm text-green-600 font-medium mb-1">Plant Count</div>
                      <div className="font-bold text-gray-900">{plantLot.plantCount}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                      <div className="text-sm text-green-600 font-medium mb-1">Planted Date</div>
                      <div className="font-bold text-gray-900">
                        {new Date(plantLot.plantedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
                    {(user.role === 'manager' || user.role === 'field_staff') && (
                      <Button
                        onClick={() => setShowHealthForm(true)}
                        className="bg-green-600 hover:bg-green-700 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Health Report
                      </Button>
                    )}
                    <Button asChild variant="outline" className="rounded-2xl border-2">
                      <Link href={`/plant-lots/${plantLot.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Details
                      </Link>
                    </Button>
                    {(user.role === 'manager' || user.role === 'field_staff') && (
                      <Button asChild variant="outline" className="rounded-2xl border-2">
                        <Link href={`/plant-lots/${plantLot.id}/edit`}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit Plant Lot
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Health Log History */}
              <HealthLogHistory 
                plantLotId={plantLot.id} 
                refresh={refreshHistory}
                onRefreshComplete={() => setRefreshHistory(false)}
              />
            </div>
          )}

          {/* Health Report Form Modal */}
          {showHealthForm && plantLot && (
            <HealthReportForm
              plantLotId={plantLot.id}
              plantLotNumber={plantLot.lotNumber}
              onSuccess={handleHealthReportSuccess}
              onCancel={() => setShowHealthForm(false)}
            />
          )}
        </div>
      </main>
      </div>
    </AppLayout>
  );
}
