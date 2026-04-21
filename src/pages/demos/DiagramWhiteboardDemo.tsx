import React, { useState, useCallback } from 'react';
import ImageUploader from '../../components/ImageUploader';
import ImageCanvas, { CanvasTextOverlay } from '../../components/ImageCanvas';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

const DiagramWhiteboardDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['read'],
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [view, setView] = useState<'labels' | 'list'>('labels');

  const handleImage = useCallback((base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    setView('labels');
    analyze(base64);
  }, [analyze]);

  const lines = result?.read?.blocks?.flatMap((b) => b.lines) ?? [];

  // Sort by vertical position for reading order
  const sortedLines = [...lines].sort((a, b) => {
    const ay = Math.min(...a.boundingPolygon.map((p) => p.y));
    const by = Math.min(...b.boundingPolygon.map((p) => p.y));
    return ay - by;
  });

  const textOverlays: CanvasTextOverlay[] = lines.map((l) => ({
    text: l.text,
    boundingPolygon: l.boundingPolygon,
  }));

  const copyText = () => {
    navigator.clipboard.writeText(sortedLines.map((l) => l.text).join('\n'));
  };

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Scanning diagram…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {lines.length > 0 && (
        <>
          {/* Toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['labels', 'list'] as const).map((v) => (
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
                {v === 'labels' ? 'Positioned Labels' : 'Reading Order'}
              </button>
            ))}
          </div>

          {view === 'labels' && imageSrc && (
            <ImageCanvas imageSrc={imageSrc} textOverlays={textOverlays} />
          )}

          {view === 'list' && (
            <div style={{
              padding: 16, background: '#fafafa', borderRadius: 8,
              border: '1px solid #e0e0e0',
            }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#666', marginBottom: 8,
              }}>
                Text in Reading Order
              </div>
              {sortedLines.map((line, i) => (
                <div key={i} style={{
                  padding: '6px 0',
                  borderBottom: i < sortedLines.length - 1 ? '1px solid #e0e0e0' : 'none',
                  fontSize: '0.875rem', color: '#111',
                }}>
                  {line.text}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={copyText}
            style={{
              padding: '8px 16px', fontSize: '0.8125rem', fontWeight: 500,
              border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff',
              cursor: 'pointer', minHeight: 44,
            }}
          >
            📋 Copy All Text
          </button>
        </>
      )}
    </>
  );
};

export default DiagramWhiteboardDemo;
