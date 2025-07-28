'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { plantLotsApi } from '../../lib/api';
import { PlantLot } from '../../lib/types';

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

    // In a real implementation, you would use a QR code library here
    // For now, we'll simulate QR code detection
    // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // This is a placeholder - in reality you'd use a library like jsQR
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    
    // For demo purposes, we'll simulate finding a QR code after a few captures
    setTimeout(() => {
      // Simulate QR code detection
      const simulatedQRCode = 'PLT-' + Math.random().toString(36).substr(2, 9);
      handleQRCodeDetected(simulatedQRCode);
    }, 2000);
  };

  const handleQRCodeDetected = async (qrCode: string) => {
    try {
      setScannedCode(qrCode);
      setError(null);
      
      // Try to parse the QR code as JSON first (new format)
      try {
        const qrData = JSON.parse(qrCode);
        if (qrData.lotId) {
          // New format: QR code contains JSON with lotId
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
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/plant-lots" className="text-green-600 hover:text-green-700">
                ← Back to Plant Lots
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">QR Scanner</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {!plantLot ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Camera Scanner */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Camera Scanner
                  </h3>
                  
                  {cameraSupported ? (
                    <div className="space-y-4">
                      <div className="relative aspect-square bg-gray-900 rounded-lg overflow-hidden">
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
                              <div className="w-16 h-16 mx-auto mb-4 border-2 border-white rounded-lg flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <p>Camera not started</p>
                            </div>
                          </div>
                        )}

                        {scanning && (
                          <div className="absolute inset-0 border-4 border-green-500 rounded-lg">
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div className="w-48 h-48 border-2 border-white rounded-lg bg-transparent"></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-4">
                        {!scanning ? (
                          <button
                            onClick={startCamera}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                          >
                            Start Camera
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={captureFrame}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Scan QR Code
                            </button>
                            <button
                              onClick={stopCamera}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Stop
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </div>
                      <p className="text-gray-600">Camera not available</p>
                      <p className="text-sm text-gray-500 mt-2">Please use manual entry below</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Entry */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Manual Entry
                  </h3>
                  
                  <form onSubmit={handleManualEntry} className="space-y-4">
                    <div>
                      <label htmlFor="manualCode" className="block text-sm font-medium text-gray-700">
                        Enter QR Code
                      </label>
                      <input
                        type="text"
                        id="manualCode"
                        name="manualCode"
                        placeholder="e.g., PLT-ABC123XYZ"
                        className="mt-1 focus:ring-green-500 focus:border-green-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Look Up Plant Lot
                    </button>
                  </form>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Point camera at QR code and tap &quot;Scan QR Code&quot;</li>
                      <li>• Or manually type/paste the QR code text</li>
                      <li>• QR codes are usually in format: PLT-XXXXXXXXX</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Plant Lot Details */
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Plant Lot Found
                    </h3>
                    <p className="text-sm text-gray-500">QR Code: {scannedCode}</p>
                  </div>
                  <button
                    onClick={resetScanner}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Scan Another
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Lot Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{plantLot.lotNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${{
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
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Species</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {plantLot.species?.name || `Species ID: ${plantLot.speciesId}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Zone</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {plantLot.zone?.name || `Zone ID: ${plantLot.zoneId}`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Plant Count</dt>
                      <dd className="mt-1 text-sm text-gray-900">{plantLot.plantCount}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Planted Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(plantLot.plantedDate).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex space-x-4">
                    <Link
                      href={`/plant-lots/${plantLot.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      View Details
                    </Link>
                    {(user.role === 'manager' || user.role === 'field_staff') && (
                      <Link
                        href={`/plant-lots/${plantLot.id}/edit`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Edit Plant Lot
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
