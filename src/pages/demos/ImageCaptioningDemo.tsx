import React from 'react';
import ImageUploader from '../../components/ImageUploader';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

const ImageCaptioningDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['caption'],
  });

  const handleImage = (base64: string) => {
    analyze(base64);
  };

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Analyzing image…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {result?.caption && (
        <div style={{
          padding: '20px 16px',
          border: '1.5px solid #222222',
          borderRadius: 12,
          background: '#ffffff',
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#666666',
            marginBottom: 8,
          }}>
            Caption
          </div>
          <div style={{
            fontSize: '1.125rem',
            color: '#111111',
            marginBottom: 12,
            lineHeight: 1.4,
          }}>
            "{result.caption.text}"
          </div>
          <ConfidenceBadge score={result.caption.confidence} label="Confidence" />
        </div>
      )}
    </>
  );
};

export default ImageCaptioningDemo;
