import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, AlertTriangle, Image } from 'lucide-react';

interface PhotoUploadProps {
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  compressionQuality?: number;
  maxFileSize?: number; // in MB
  disabled?: boolean;
  existingPhotos?: string[];
}

interface PhotoFile {
  id: string;
  dataUrl: string;
  file: File;
  size: number;
  compressed: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onPhotosChange,
  maxPhotos = 5,
  compressionQuality = 0.8,
  maxFileSize = 2, // 2MB default
  disabled = false,
  existingPhotos = []
}) => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize existing photos if provided
  React.useEffect(() => {
    if (existingPhotos.length > 0) {
      const existingPhotoFiles: PhotoFile[] = existingPhotos.map((url, index) => ({
        id: `existing-${index}`,
        dataUrl: url,
        file: new File([], `existing-photo-${index}.jpg`),
        size: 0,
        compressed: true
      }));
      setPhotos(existingPhotoFiles);
    }
  }, [existingPhotos]);

  // Update parent component when photos change
  React.useEffect(() => {
    const photoUrls = photos.map(photo => photo.dataUrl);
    onPhotosChange(photoUrls);
  }, [photos, onPhotosChange]);

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // FIXED: Use document.createElement instead of new Image()
      const img = document.createElement('img') as HTMLImageElement;
      
      img.onload = () => {
        // Calculate new dimensions (max 1200px width, maintain aspect ratio)
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', compressionQuality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, [compressionQuality]);

  const handleFileSelect = async (files: FileList) => {
    if (photos.length >= maxPhotos) {
      setUploadError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const newPhotos: PhotoFile[] = [];
      
      for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setUploadError('Please select only image files');
          continue;
        }
        
        // Validate file size
        if (file.size > maxFileSize * 1024 * 1024) {
          setUploadError(`File size must be less than ${maxFileSize}MB`);
          continue;
        }
        
        // Compress image
        const compressedDataUrl = await compressImage(file);
        
        const photoFile: PhotoFile = {
          id: `photo-${Date.now()}-${i}`,
          dataUrl: compressedDataUrl,
          file,
          size: file.size,
          compressed: true
        };
        
        newPhotos.push(photoFile);
      }
      
      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (error) {
      console.error('Error processing photos:', error);
      setUploadError('Failed to process photos');
    } finally {
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    try {
      setUploadError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setCameraStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setUploadError('Camera access denied. Please use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert to data URL with compression
    const dataUrl = canvas.toDataURL('image/jpeg', compressionQuality);
    
    // Create photo file
    const photoFile: PhotoFile = {
      id: `camera-${Date.now()}`,
      dataUrl,
      file: new File([], `camera-photo-${Date.now()}.jpg`),
      size: dataUrl.length,
      compressed: true
    };
    
    setPhotos(prev => [...prev, photoFile]);
    stopCamera();
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileSelect(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Camera Header */}
        <div className="bg-slate-900/90 p-4 flex items-center justify-between">
          <button
            onClick={stopCamera}
            className="p-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-white font-medium">Take Equipment Photo</h3>
          <div className="w-9" /> {/* Spacer */}
        </div>
        
        {/* Camera View */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Camera Controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <button
              onClick={capturePhoto}
              disabled={photos.length >= maxPhotos}
              className="w-16 h-16 bg-white rounded-full border-4 border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Camera className="h-8 w-8 text-blue-500" />
            </button>
          </div>
          
          {/* Photo Count */}
          <div className="absolute top-4 right-4 bg-black/50 rounded-lg px-3 py-1">
            <span className="text-white text-sm">
              {photos.length} / {maxPhotos}
            </span>
          </div>
        </div>
        
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Camera Button (mobile devices) */}
        {'mediaDevices' in navigator && (
          <button
            onClick={startCamera}
            disabled={disabled || photos.length >= maxPhotos || isUploading}
            className="flex-1 flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera className="h-5 w-5 text-slate-400" />
            <span className="text-slate-300">Take Photo</span>
          </button>
        )}
        
        {/* File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || photos.length >= maxPhotos || isUploading}
          className="flex-1 flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-slate-600 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-5 w-5 text-slate-400" />
          <span className="text-slate-300">Upload Files</span>
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
      
      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center space-x-2 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-200 text-sm">Processing photos...</span>
        </div>
      )}
      
      {/* Error Display */}
      {uploadError && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-red-200 text-sm">{uploadError}</span>
        </div>
      )}
      
      {/* Photo Counter */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>{photos.length} / {maxPhotos} photos</span>
        <span>Max {maxFileSize}MB each</span>
      </div>
      
      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square bg-slate-700 rounded-lg overflow-hidden">
                <img
                  src={photo.dataUrl}
                  alt="Equipment photo"
                  className="w-full h-full object-cover"
                />
                
                {/* Photo overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Photo info */}
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Image className="h-3 w-3" />
                  <span>JPG</span>
                </span>
                {photo.compressed && (
                  <span className="flex items-center space-x-1">
                    <Check className="h-3 w-3 text-green-400" />
                    <span>Compressed</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Guidelines */}
      <div className="p-3 bg-slate-800/30 border border-slate-600/30 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">Photo Guidelines</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Take clear photos showing equipment condition</li>
          <li>• Include before/after shots if applicable</li>
          <li>• Ensure good lighting for best visibility</li>
          <li>• Focus on relevant equipment areas</li>
          <li>• Photos are automatically compressed for faster upload</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotoUpload;