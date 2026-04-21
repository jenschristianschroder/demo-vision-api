import React, { useState, useCallback } from 'react';
import ImageUploader from '../../components/ImageUploader';
import { analyzeAdultContent } from '../../services/visionClient';
import { VisionResult } from '../../types';

const BrandSafetyDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleImage = useCallback(async (base64: string) => {
    setImageSrc(`data:image/jpeg;base64,${base64}`);
    setRevealed(false);
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await analyzeAdultContent(base64);
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adult = result?.adult;

  const shouldBlur = adult && (adult.isAdultContent || adult.isRacyContent || adult.isGoryContent);

  const renderGauge = (label: string, score: number, isFlagged: boolean) => {
    const pct = Math.round(score * 100);
    let color = '#2e7d32';
    if (score > 0.5) color = '#c62828';
    else if (score > 0.2) color = '#f57f17';

    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 4,
        }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
          <span style={{ fontSize: '0.75rem', color: isFlagged ? '#c62828' : '#2e7d32', fontWeight: 600 }}>
            {isFlagged ? '⚠️ Flagged' : '✅ Safe'}
          </span>
        </div>
        <div style={{
          height: 8, background: '#e0e0e0', borderRadius: 4, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`, background: color,
            borderRadius: 4, transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: '0.7rem', color: '#999', marginTop: 2 }}>{pct}%</div>
      </div>
    );
  };

  return (
    <>
      <ImageUploader onImageSelected={handleImage} />

      {isLoading && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Analyzing content safety…</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {adult && (
        <>
          {/* Image (possibly blurred) */}
          {imageSrc && (
            <div style={{ position: 'relative' }}>
              <img
                src={imageSrc}
                alt="Analyzed"
                style={{
                  width: '100%', borderRadius: 8, border: '1px solid #e0e0e0',
                  filter: shouldBlur && !revealed ? 'blur(20px)' : 'none',
                  transition: 'filter 0.3s',
                }}
              />
              {shouldBlur && !revealed && (
                <button
                  onClick={() => setRevealed(true)}
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '10px 20px', fontSize: '0.875rem', fontWeight: 600,
                    background: 'rgba(0,0,0,0.7)', color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    minHeight: 44,
                  }}
                >
                  Reveal Image
                </button>
              )}
            </div>
          )}

          {/* Safety dashboard */}
          <div style={{
            padding: '20px 16px', border: '1.5px solid #222', borderRadius: 12,
          }}>
            <div style={{
              fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: '#666', marginBottom: 16,
            }}>
              Content Safety Analysis
            </div>

            {renderGauge('Adult Content', adult.adultScore, adult.isAdultContent)}
            {renderGauge('Racy Content', adult.racyScore, adult.isRacyContent)}
            {renderGauge('Gory Content', adult.goreScore, adult.isGoryContent)}

            {/* Overall verdict */}
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 8,
              background: shouldBlur ? '#fff5f5' : '#e8f5e9',
              fontSize: '0.875rem', fontWeight: 600,
              color: shouldBlur ? '#c62828' : '#2e7d32',
              textAlign: 'center',
            }}>
              {shouldBlur
                ? '⚠️ Review recommended — content may not be suitable for all audiences'
                : '✅ Safe for all audiences'}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BrandSafetyDemo;
