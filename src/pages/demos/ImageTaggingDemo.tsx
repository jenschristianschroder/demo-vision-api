import React from 'react';
import ImageUploader from '../../components/ImageUploader';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

const ImageTaggingDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['tags'],
  });

  const handleImage = (base64: string) => {
    analyze(base64);
  };

  const tags = result?.tags ?? [];

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Extracting tags…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {tags.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: '16px 0',
        }}>
          {tags.map((tag, i) => {
            const pct = Math.round(tag.confidence * 100);
            let bg: string, color: string, border: string;
            if (tag.confidence >= 0.8) {
              bg = '#111111'; color = '#ffffff'; border = '#111111';
            } else if (tag.confidence >= 0.5) {
              bg = '#ffffff'; color = '#111111'; border = '#222222';
            } else {
              bg = '#f5f5f5'; color = '#999999'; border = '#e0e0e0';
            }
            return (
              <span key={i} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: tag.confidence >= 0.5 ? '0.875rem' : '0.75rem',
                fontWeight: 500,
                background: bg,
                color,
                border: `1.5px solid ${border}`,
              }}>
                {tag.name}
                <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>{pct}%</span>
              </span>
            );
          })}
        </div>
      )}
    </>
  );
};

export default ImageTaggingDemo;
