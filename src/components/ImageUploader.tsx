import React, { useRef, useState, useCallback } from 'react';
import './ImageUploader.css';

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
        <span className="upload-zone-icon">📷</span>
        <span className="upload-zone-text">
          Drop an image here, paste from clipboard, or tap to browse
        </span>
      </div>

      <div className="upload-actions">
        <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
          📁 Browse
        </button>
        {showCamera && (
          <button className="upload-btn" onClick={() => cameraInputRef.current?.click()}>
            📸 Camera
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
