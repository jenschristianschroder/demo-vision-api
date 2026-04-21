import React, { useState, useCallback, useMemo } from 'react';
import ImageUploader from '../../components/ImageUploader';
import ImageCanvas, { CanvasTextOverlay } from '../../components/ImageCanvas';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

// Lightweight receipt parsing heuristics
function parseReceipt(lines: string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  if (lines.length > 0) fields['Store'] = lines[0];

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Date patterns
    const dateMatch = line.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/);
    if (dateMatch && !fields['Date']) fields['Date'] = dateMatch[0];

    // Total patterns
    if (/total/i.test(lower)) {
      const amtMatch = line.match(/[\$€£]?\s?\d+[.,]\d{2}/);
      if (amtMatch) fields['Total'] = amtMatch[0];
    }

    // Subtotal
    if (/subtotal|sub.?total/i.test(lower)) {
      const amtMatch = line.match(/[\$€£]?\s?\d+[.,]\d{2}/);
      if (amtMatch) fields['Subtotal'] = amtMatch[0];
    }

    // Tax
    if (/\btax\b/i.test(lower)) {
      const amtMatch = line.match(/[\$€£]?\s?\d+[.,]\d{2}/);
      if (amtMatch) fields['Tax'] = amtMatch[0];
    }
  }

  // Line items: lines with a price pattern that aren't total/tax/subtotal
  const items: string[] = [];
  for (const line of lines) {
    if (/total|tax|subtotal|change|visa|mastercard|card/i.test(line)) continue;
    if (/[\$€£]?\s?\d+[.,]\d{2}/.test(line) && line.length > 3) {
      items.push(line);
    }
  }
  if (items.length > 0) fields['Items'] = items.join('\n');

  return fields;
}

const ReceiptLabelDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['read'],
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleImage = useCallback((base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    setShowRaw(false);
    analyze(base64);
  }, [analyze]);

  const lines = result?.read?.blocks?.flatMap((b) => b.lines) ?? [];
  const lineTexts = lines.map((l) => l.text);
  const fullText = lineTexts.join('\n');

  const parsed = useMemo(() => parseReceipt(lineTexts), [lineTexts]);

  const textOverlays: CanvasTextOverlay[] = lines.map((l) => ({
    text: l.text,
    boundingPolygon: l.boundingPolygon,
  }));

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Reading receipt…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {lines.length > 0 && (
        <>
          {/* Split layout */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Left — image with overlay */}
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              {imageSrc && <ImageCanvas imageSrc={imageSrc} textOverlays={textOverlays} />}
            </div>

            {/* Right — parsed fields */}
            <div style={{
              flex: '1 1 200px', minWidth: 0,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#666',
              }}>
                Parsed Data
              </div>
              {Object.entries(parsed).map(([key, value]) => (
                <div key={key} style={{
                  padding: '10px 14px',
                  background: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 2 }}>
                    {key}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#111', whiteSpace: 'pre-wrap' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw text toggle */}
          <div>
            <button
              onClick={() => setShowRaw(!showRaw)}
              style={{
                padding: '8px 16px', fontSize: '0.8125rem', fontWeight: 500,
                border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff',
                cursor: 'pointer', minHeight: 44,
              }}
            >
              {showRaw ? '▾ Hide' : '▸ Show'} Raw Text
            </button>
            {showRaw && (
              <pre style={{
                marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 8,
                border: '1px solid #e0e0e0', fontSize: '0.75rem', whiteSpace: 'pre-wrap',
                wordBreak: 'break-word', lineHeight: 1.5,
              }}>
                {fullText}
              </pre>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default ReceiptLabelDemo;
