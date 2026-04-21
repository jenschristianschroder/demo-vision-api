import React, { useState, useCallback } from 'react';
import ImageUploader from '../../components/ImageUploader';
import ImageCanvas, { CanvasBoundingBox } from '../../components/ImageCanvas';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

const FaceDetectionDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['people'],
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleImage = useCallback((base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    analyze(base64);
  }, [analyze]);

  const people = result?.people ?? [];

  const boxes: CanvasBoundingBox[] = people.map((p, i) => ({
    boundingBox: p.boundingBox,
    label: `${i + 1}`,
    confidence: p.confidence,
    color: '#0078d4',
  }));

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Detecting faces…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {imageSrc && people.length > 0 && (
        <>
          {/* Count badge */}
          <div style={{
            padding: '10px 16px', background: '#f0f7ff', borderRadius: 8,
            fontSize: '1rem', fontWeight: 600, color: '#0078d4', textAlign: 'center',
          }}>
            👤 {people.length} face{people.length !== 1 ? 's' : ''} detected
          </div>

          <ImageCanvas imageSrc={imageSrc} boundingBoxes={boxes} showLabels />

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {people.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#0078d4', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: '0.875rem' }}>Person {i + 1}</span>
                <ConfidenceBadge score={p.confidence} />
              </div>
            ))}
          </div>

          <div style={{
            fontSize: '0.75rem', color: '#999', textAlign: 'center', fontStyle: 'italic',
          }}>
            Face detection only — no identification or recognition
          </div>
        </>
      )}

      {imageSrc && !isLoading && people.length === 0 && result && (
        <div style={{
          padding: '16px', textAlign: 'center', color: '#666', fontSize: '0.875rem',
        }}>
          No faces detected in this image.
        </div>
      )}
    </>
  );
};

export default FaceDetectionDemo;
