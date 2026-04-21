import React, { useState, useCallback } from 'react';
import ImageUploader from '../../components/ImageUploader';
import ImageCanvas, { CanvasTextOverlay } from '../../components/ImageCanvas';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

const OcrTextDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['read'],
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [view, setView] = useState<'overlay' | 'text'>('overlay');

  const handleImage = useCallback((base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    setView('overlay');
    analyze(base64);
  }, [analyze]);

  const lines = result?.read?.blocks?.flatMap((b) => b.lines) ?? [];
  const fullText = lines.map((l) => l.text).join('\n');

  const textOverlays: CanvasTextOverlay[] = lines.map((l) => ({
    text: l.text,
    boundingPolygon: l.boundingPolygon,
  }));

  const copyText = () => {
    navigator.clipboard.writeText(fullText);
  };

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Extracting text…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {lines.length > 0 && (
        <>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['overlay', 'text'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  flex: 1, padding: '10px 0', fontSize: '0.875rem', fontWeight: 600,
                  border: view === v ? '1.5px solid #111' : '1px solid #e0e0e0',
                  borderRadius: 8,
                  background: view === v ? '#111' : '#fff',
                  color: view === v ? '#fff' : '#111',
                  cursor: 'pointer', minHeight: 44,
                }}
              >
                {v === 'overlay' ? 'Overlay' : 'Text Only'}
              </button>
            ))}
          </div>

          {view === 'overlay' && imageSrc && (
            <ImageCanvas imageSrc={imageSrc} textOverlays={textOverlays} />
          )}

          {/* Extracted text */}
          <div style={{
            padding: '16px',
            background: '#fafafa',
            borderRadius: 8,
            border: '1px solid #e0e0e0',
            position: 'relative',
          }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#666', marginBottom: 8,
            }}>
              Extracted Text ({lines.length} lines)
            </div>
            <pre style={{
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: '#111',
              margin: 0,
            }}>
              {fullText}
            </pre>
            <button
              onClick={copyText}
              style={{
                marginTop: 12,
                padding: '8px 16px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                background: '#fff',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              📋 Copy Text
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default OcrTextDemo;
