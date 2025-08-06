import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Type, Flashlight } from 'lucide-react';
import { useEquipment } from '../contexts/EquipmentContext';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (equipment: any) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const { scanQRCode } = useEquipment();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Test QR codes for demo
  const testCodes = [
    'CB-PREC-PPC410-TOCA1-001',
    'CB-PREC-PPC307-TOCA1-001', 
    'CB-PREC-HPU153-TOCA1-001',
    'CB-PREC-LPU150-TOCA1-001',
    'CB-RATI-ICP101-TOCA1-001',
    'CB-HOBA-AMXSW10B-TOCA1-001'
  ];
  
  useEffect(() => {
    if (isOpen && !showManualEntry) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, showManualEntry]);
  
  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
    } catch (error) {
      console.error('Failed to start camera:', error);
      setError('Camera access denied. Please use manual entry or check camera permissions.');
      setShowManualEntry(true);
    } finally {
      setIsScanning(false);
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const handleManualScan = async (code: string) => {
    if (!code.trim()) return;
    
    try {
      setIsScanning(true);
      setError(null);
      
      const equipment = await scanQRCode(code.trim());
      
      if (equipment) {
        onScanSuccess(equipment);
      } else {
        setError(`Equipment not found for QR code: ${code}`);
      }
      
    } catch (error) {
      console.error('QR scan failed:', error);
      setError('Failed to scan QR code. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };
  
  const handleTestCode = (code: string) => {
    setManualCode(code);
    handleManualScan(code);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={onClose}
        ></div>
        
        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Scan Equipment QR Code
            </h3>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setShowManualEntry(false);
                setError(null);
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                !showManualEntry
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="h-4 w-4 inline mr-1" />
              Camera Scan
            </button>
            <button
              onClick={() => {
                setShowManualEntry(true);
                stopCamera();
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                showManualEntry
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Type className="h-4 w-4 inline mr-1" />
              Manual Entry
            </button>
          </div>
          
          {/* Camera View */}
          {!showManualEntry && (
            <div className="mb-4">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                    
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-50 rounded px-2 py-1">
                    Position QR code within the frame
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Manual Entry */}
          {showManualEntry && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter QR Code
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="CB-PREC-PPC410-TOCA1-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualScan(manualCode);
                  }
                }}
              />
              
              <button
                onClick={() => handleManualScan(manualCode)}
                disabled={!manualCode.trim() || isScanning}
                className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScanning ? 'Scanning...' : 'Scan QR Code'}
              </button>
            </div>
          )}
          
          {/* Test Codes */}
          {showManualEntry && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Test QR Codes:</p>
              <div className="grid grid-cols-2 gap-2">
                {testCodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => handleTestCode(code)}
                    disabled={isScanning}
                    className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {code.split('-').slice(-2).join('-')}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {/* Footer */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {showManualEntry ? (
                <span>Enter the QR code manually</span>
              ) : (
                <span>Point camera at QR code</span>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;