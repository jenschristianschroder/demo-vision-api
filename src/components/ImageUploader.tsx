import React, { useRef, useState, useCallback } from 'react';
import './ImageUploader.css';

const CameraIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.586 5l-2-2H10.414l-2 2H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3.414z" fill="#e0e0e0" />
    <path d="M15.586 5l-2-2H10.414l-2 2H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-3.414zM4.5 7A.5.5 0 015 6.5h3.414a1 1 0 00.707-.293L10.914 4.5h2.172l1.793 1.707a1 1 0 00.707.293H19a.5.5 0 01.5.5v11a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V7z" fill="#111" />
    <circle cx="12" cy="12.5" r="3.5" fill="#0078d4" opacity="0.85" />
    <circle cx="12" cy="12.5" r="3.5" stroke="#111" strokeWidth="1.5" fill="none" />
  </svg>
);

const FolderIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 5a2 2 0 012-2h4.172a1 1 0 01.707.293L10.586 5H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" fill="#f9a825" opacity="0.7" />
    <path d="M2 5a2 2 0 012-2h4.172a1 1 0 01.707.293L10.586 5H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V5zM4 4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-5.414a1 1 0 01-.707-.293L8.172 4H4z" fill="#111" />
  </svg>
);

const CameraActionIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 4l-1.6-1.6A1 1 0 0010.7 2H9.3a1 1 0 00-.7.4L7 4H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-3z" fill="#e0e0e0" />
    <path d="M13 4l-1.6-1.6A1 1 0 0010.7 2H9.3a1 1 0 00-.7.4L7 4H4a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-3zM4 5h3a1 1 0 00.7-.4L9.3 3h1.4l1.6 1.6a1 1 0 00.7.4h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" fill="#111" />
    <circle cx="10" cy="10.5" r="3" fill="#0078d4" opacity="0.85" />
    <circle cx="10" cy="10.5" r="3" stroke="#111" strokeWidth="1.2" fill="none" />
  </svg>
);

interface ImageUploaderProps {
  onImageSelected: (imageData: string, file: File) => void;
  accept?: string;
  showCamera?: boolean;
  maxSizeMB?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  accept = 'image/*',
  showCamera = true,
  maxSizeMB = 4,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large. Maximum size is ${maxSizeMB}MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        // Strip the data URL prefix to get raw base64
        const base64 = dataUrl.split(',')[1];
        onImageSelected(base64, file);
      };
      reader.readAsDataURL(file);
    },
    [maxSizeMB, onImageSelected],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) processFile(file);
          break;
        }
      }
    },
    [processFile],
  );

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const clear = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  if (preview) {
    return (
      <div className="image-uploader">
        <div className="upload-preview">
          <img src={preview} alt="Selected" />
          <button className="upload-preview-clear" onClick={clear}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="image-uploader">
      <div
        className={`upload-zone${dragging ? ' dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="upload-zone-icon"><CameraIcon size={32} /></span>
        <span className="upload-zone-text">
          Drop an image here, paste from clipboard, or tap to browse
        </span>
      </div>

      <div className="upload-actions">
        <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
          <FolderIcon /> Browse
        </button>
        {showCamera && (
          <button className="upload-btn" onClick={() => cameraInputRef.current?.click()}>
            <CameraActionIcon /> Camera
          </button>
        )}
      </div>

      {error && <div className="upload-error">{error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {showCamera && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

export default ImageUploader;
