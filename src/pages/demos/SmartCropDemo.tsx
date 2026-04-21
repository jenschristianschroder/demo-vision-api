import React, { useState, useCallback, useRef, useEffect } from 'react';
import ImageUploader from '../../components/ImageUploader';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

// Azure Vision API smart crop supports aspect ratios between 0.75 and 1.8 inclusive.
const ASPECT_RATIOS = [
  { label: '3:4', value: 0.75 },
  { label: '1:1', value: 1.0 },
  { label: '4:3', value: 1.33 },
  { label: '16:9', value: 1.78 },
];

const SmartCropDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['smartCrops'],
    smartCropsAspectRatios: ASPECT_RATIOS.map((r) => r.value),
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleImage = useCallback((base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    setSelectedRatio(0);
    analyze(base64);
  }, [analyze]);

  const crops = result?.smartCrops ?? [];
  const selectedCrop = crops[selectedRatio];

  // Draw original with crop overlay
  useEffect(() => {
    if (!imageSrc || !selectedCrop) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = imgRef.current ?? new Image();
    img.onload = () => {
      imgRef.current = img;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const containerWidth = canvas.parentElement?.clientWidth ?? img.naturalWidth;
      const scale = containerWidth / img.naturalWidth;
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Dim area outside crop
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear crop region
      const { x, y, w, h } = selectedCrop.boundingBox;
      ctx.clearRect(x * scale, y * scale, w * scale, h * scale);
      ctx.drawImage(
        img,
        x, y, w, h,
        x * scale, y * scale, w * scale, h * scale,
      );

      // Dashed border around crop
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x * scale, y * scale, w * scale, h * scale);
      ctx.setLineDash([]);
    };
    if (img.src !== imageSrc) img.src = imageSrc;
    else img.onload(new Event('load') as unknown as Event);
  }, [imageSrc, selectedCrop]);

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Computing smart crops…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {crops.length > 0 && (
        <>
          {/* Ratio selector */}
          <div style={{ display: 'flex', gap: 8 }}>
            {ASPECT_RATIOS.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setSelectedRatio(i)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: selectedRatio === i ? '1.5px solid #111' : '1px solid #e0e0e0',
                  borderRadius: 8,
                  background: selectedRatio === i ? '#111' : '#fff',
                  color: selectedRatio === i ? '#fff' : '#111',
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Canvas with overlay */}
          <div style={{ position: 'relative', width: '100%' }}>
            <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 8, border: '1px solid #e0e0e0', display: 'block' }} />
          </div>

          {/* Cropped previews */}
          <div style={{
            fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: '#666', marginTop: 8,
          }}>
            Cropped Previews
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {crops.map((crop, i) => {
              const { x, y, w, h } = crop.boundingBox;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedRatio(i)}
                  style={{
                    flexShrink: 0,
                    width: 100,
                    aspectRatio: `${crop.aspectRatio}`,
                    overflow: 'hidden',
                    borderRadius: 8,
                    border: selectedRatio === i ? '2px solid #0078d4' : '1px solid #e0e0e0',
                    cursor: 'pointer',
                  }}
                >
                  {imageSrc && (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url(${imageSrc})`,
                      backgroundPosition: `${(x / ((imgRef.current?.naturalWidth ?? 1) - w)) * 100}% ${(y / ((imgRef.current?.naturalHeight ?? 1) - h)) * 100}%`,
                      backgroundSize: `${((imgRef.current?.naturalWidth ?? 1) / w) * 100}%`,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
};

export default SmartCropDemo;
