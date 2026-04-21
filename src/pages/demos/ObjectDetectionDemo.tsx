import React, { useState, useCallback } from 'react';
import ImageUploader from '../../components/ImageUploader';
import ImageCanvas, { CanvasBoundingBox } from '../../components/ImageCanvas';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

const COLORS = [
  '#0078d4', '#e74c3c', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#3498db',
];

const ObjectDetectionDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['objects'],
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);

  const handleImage = useCallback((base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    analyze(base64);
  }, [analyze]);

  const objects = result?.objects ?? [];

  // Group by name for summary
  const counts: Record<string, number> = {};
  objects.forEach((o) => {
    counts[o.name] = (counts[o.name] || 0) + 1;
  });

  const boxes: CanvasBoundingBox[] = showBoxes
    ? objects.map((o, i) => ({
        boundingBox: o.boundingBox,
        label: o.name,
        confidence: o.confidence,
        color: COLORS[i % COLORS.length],
      }))
    : [];

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Detecting objects…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {imageSrc && objects.length > 0 && (
        <>
          {/* Summary bar */}
          <div style={{
            padding: '10px 16px',
            background: '#fafafa',
            borderRadius: 8,
            fontSize: '0.875rem',
            color: '#111',
          }}>
            Detected <strong>{objects.length}</strong> object{objects.length !== 1 ? 's' : ''}:
            {' '}{Object.entries(counts).map(([name, count]) => `${count} ${name}`).join(', ')}
          </div>

          {/* Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showBoxes}
              onChange={(e) => setShowBoxes(e.target.checked)}
              style={{ minHeight: 'auto' }}
            />
            Show bounding boxes
          </label>

          <ImageCanvas imageSrc={imageSrc} boundingBoxes={boxes} showLabels />

          {/* Object list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {objects.map((o, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0',
              }}>
                <span style={{
                  width: 12, height: 12, borderRadius: 2,
                  background: COLORS[i % COLORS.length], flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{o.name}</span>
                <ConfidenceBadge score={o.confidence} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default ObjectDetectionDemo;
