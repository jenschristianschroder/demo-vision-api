import React, { useState, useCallback } from 'react';
import ImageUploader from '../../components/ImageUploader';
import ImageCanvas, { CanvasBoundingBox } from '../../components/ImageCanvas';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

const DenseCaptionsDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['denseCaptions'],
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [highlightIdx, setHighlightIdx] = useState<number | undefined>(undefined);

  const handleImage = useCallback((base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    setHighlightIdx(undefined);
    analyze(base64);
  }, [analyze]);

  const boxes: CanvasBoundingBox[] = (result?.denseCaptions ?? []).map((dc, i) => ({
    boundingBox: dc.boundingBox,
    label: `${i + 1}`,
    confidence: dc.confidence,
  }));

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Detecting regions…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {imageSrc && result?.denseCaptions && (
        <>
          <ImageCanvas
            imageSrc={imageSrc}
            boundingBoxes={boxes}
            highlightIndex={highlightIdx}
            onBoxClick={setHighlightIdx}
            showLabels
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.denseCaptions.map((dc, i) => (
              <div
                key={i}
                onClick={() => setHighlightIdx(i)}
                style={{
                  padding: '12px 16px',
                  border: highlightIdx === i ? '1.5px solid #0078d4' : '1px solid #e0e0e0',
                  borderRadius: 8,
                  background: highlightIdx === i ? '#f0f7ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#0078d4', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: '0.875rem', color: '#111' }}>
                  {dc.text}
                </span>
                <ConfidenceBadge score={dc.confidence} />
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default DenseCaptionsDemo;
