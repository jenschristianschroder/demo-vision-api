import React, { useState } from 'react';
import ImageUploader from '../../components/ImageUploader';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import { useVisionAnalysis } from '../../hooks/useVisionAnalysis';

const AltTextDemo: React.FC = () => {
  const { analyze, isLoading, result, error } = useVisionAnalysis({
    features: ['caption', 'tags'],
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImage = (base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    setCopied(false);
    analyze(base64);
  };

  const caption = result?.caption;
  const tags = result?.tags ?? [];
  const topTags = tags.slice(0, 5);

  // Compose alt-text from caption + top tags
  let altText = '';
  if (caption) {
    altText = caption.text;
    if (topTags.length > 0) {
      const tagStr = topTags.map((t) => t.name).join(', ');
      altText += `. Features: ${tagStr}.`;
    }
  }

  const copyAltText = () => {
    navigator.clipboard.writeText(altText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Generating alt-text…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {altText && (
        <>
          {/* Image */}
          {imageSrc && (
            <img
              src={imageSrc}
              alt={altText}
              style={{ width: '100%', borderRadius: 8, border: '1px solid #e0e0e0' }}
            />
          )}

          {/* Building blocks */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: '16px', background: '#fafafa', borderRadius: 8,
            border: '1px solid #e0e0e0',
          }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#666',
            }}>
              Building Blocks
            </div>

            {/* Caption */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                padding: '2px 8px', background: '#0078d4', color: '#fff',
                borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
              }}>
                CAPTION
              </span>
              <span style={{ fontSize: '0.875rem' }}>{caption?.text}</span>
              {caption && <ConfidenceBadge score={caption.confidence} />}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                padding: '2px 8px', background: '#2e7d32', color: '#fff',
                borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
              }}>
                TAGS
              </span>
              {topTags.map((t, i) => (
                <span key={i} style={{
                  padding: '2px 8px', borderRadius: 12,
                  border: '1px solid #e0e0e0', fontSize: '0.8rem',
                }}>
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* Composed alt-text */}
          <div style={{
            padding: '20px 16px', border: '1.5px solid #222', borderRadius: 12,
          }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#666', marginBottom: 8,
            }}>
              Generated Alt-Text
            </div>
            <div style={{
              fontSize: '1.125rem', color: '#111', lineHeight: 1.4, marginBottom: 12,
            }}>
              "{altText}"
            </div>
            <button
              onClick={copyAltText}
              style={{
                padding: '8px 16px', fontSize: '0.8125rem', fontWeight: 500,
                border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff',
                cursor: 'pointer', minHeight: 44,
              }}
            >
              {copied ? '✓ Copied!' : '📋 Copy Alt-Text'}
            </button>
          </div>

          {/* HTML preview */}
          <div style={{
            padding: 12, background: '#1e1e1e', borderRadius: 8,
            fontFamily: "'Consolas', monospace", fontSize: '0.75rem',
            color: '#d4d4d4', overflowX: 'auto',
          }}>
            <span style={{ color: '#569cd6' }}>&lt;img</span>
            {' '}<span style={{ color: '#9cdcfe' }}>src</span>
            <span style={{ color: '#d4d4d4' }}>=</span>
            <span style={{ color: '#ce9178' }}>"image.jpg"</span>
            {' '}<span style={{ color: '#9cdcfe' }}>alt</span>
            <span style={{ color: '#d4d4d4' }}>=</span>
            <span style={{ color: '#ce9178' }}>"{altText}"</span>
            {' '}<span style={{ color: '#569cd6' }}>/&gt;</span>
          </div>
        </>
      )}
    </>
  );
};

export default AltTextDemo;
