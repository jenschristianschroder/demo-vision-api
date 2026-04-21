import React, { useState, useRef, useCallback } from 'react';
import ConfidenceBadge from '../../components/ConfidenceBadge';
import { analyzeImage } from '../../services/visionClient';
import { VisionResult } from '../../types';

interface FrameData {
  timestamp: number;
  imageData: string; // base64
  thumbnail: string; // data URL for display
  result?: VisionResult;
  loading?: boolean;
  error?: string;
}

const INTERVALS = [
  { label: 'Every 1s', value: 1 },
  { label: 'Every 2s', value: 2 },
  { label: 'Every 5s', value: 5 },
];

const VideoFrameAnalysisDemo: React.FC = () => {
  const [frames, setFrames] = useState<FrameData[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null);
  const [interval, setIntervalVal] = useState(2);
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractFrames = useCallback(async (file: File) => {
    setExtracting(true);
    setFrames([]);
    setSelectedFrame(null);

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    const duration = Math.min(video.duration, 30); // Cap at 30s
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const newFrames: FrameData[] = [];

    for (let t = 0; t < duration; t += interval) {
      video.currentTime = t;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
      const base64 = thumbnail.split(',')[1];

      newFrames.push({
        timestamp: t,
        imageData: base64,
        thumbnail,
      });
    }

    URL.revokeObjectURL(url);
    setFrames(newFrames);
    setExtracting(false);
  }, [interval]);

  const analyzeAllFrames = useCallback(async () => {
    setAnalyzing(true);
    setProgress(0);
    const updated = [...frames];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].result) {
        setProgress(((i + 1) / updated.length) * 100);
        continue;
      }
      updated[i] = { ...updated[i], loading: true };
      setFrames([...updated]);

      try {
        const result = await analyzeImage(updated[i].imageData, ['caption', 'tags', 'objects']);
        updated[i] = { ...updated[i], result, loading: false };
      } catch {
        updated[i] = { ...updated[i], loading: false, error: 'Failed' };
      }
      setFrames([...updated]);
      setProgress(((i + 1) / updated.length) * 100);
    }
    setAnalyzing(false);
  }, [frames]);

  // Aggregate objects across frames
  const objectCounts: Record<string, number> = {};
  frames.forEach((f) => {
    f.result?.objects?.forEach((o) => {
      objectCounts[o.name] = (objectCounts[o.name] || 0) + 1;
    });
  });

  const selected = selectedFrame !== null ? frames[selectedFrame] : null;

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) extractFrames(file);
  };

  return (
    <>
      {/* Video upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '32px 16px', border: '2px dashed #e0e0e0', borderRadius: 12,
          background: '#fafafa', cursor: 'pointer', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎬</div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          Tap to select a video file (mp4, webm) — max 30 seconds
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm"
        onChange={handleVideoFile}
        style={{ display: 'none' }}
      />

      {/* Interval selector */}
      <div style={{ display: 'flex', gap: 8 }}>
        {INTERVALS.map((int) => (
          <button
            key={int.value}
            onClick={() => setIntervalVal(int.value)}
            style={{
              flex: 1, padding: '10px 0', fontSize: '0.875rem', fontWeight: 600,
              border: interval === int.value ? '1.5px solid #111' : '1px solid #e0e0e0',
              borderRadius: 8,
              background: interval === int.value ? '#111' : '#fff',
              color: interval === int.value ? '#fff' : '#111',
              cursor: 'pointer', minHeight: 44,
            }}
          >
            {int.label}
          </button>
        ))}
      </div>

      {extracting && (
        <div className="demo-loading">
          <div className="spinner" />
          <span>Extracting frames…</span>
        </div>
      )}

      {frames.length > 0 && (
        <>
          {/* Analyze button */}
          <button
            onClick={analyzeAllFrames}
            disabled={analyzing}
            style={{
              width: '100%', padding: '12px 0', fontSize: '0.875rem', fontWeight: 600,
              background: analyzing ? '#666' : '#000', color: '#fff',
              border: 'none', borderRadius: 12, cursor: analyzing ? 'default' : 'pointer',
              minHeight: 44,
            }}
          >
            {analyzing ? `Analyzing… ${Math.round(progress)}%` : `Analyze ${frames.length} Frames`}
          </button>

          {/* Progress bar */}
          {analyzing && (
            <div style={{ height: 4, background: '#e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progress}%`, background: '#0078d4',
                transition: 'width 0.3s',
              }} />
            </div>
          )}

          {/* Filmstrip */}
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8,
          }}>
            {frames.map((frame, i) => (
              <div
                key={i}
                onClick={() => setSelectedFrame(i)}
                style={{
                  flexShrink: 0, width: 80, cursor: 'pointer',
                  borderRadius: 6, overflow: 'hidden',
                  border: selectedFrame === i ? '2px solid #0078d4' : '1px solid #e0e0e0',
                  position: 'relative',
                }}
              >
                <img
                  src={frame.thumbnail}
                  alt={`Frame at ${frame.timestamp}s`}
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', bottom: 2, left: 2,
                  padding: '1px 4px', background: 'rgba(0,0,0,0.6)',
                  color: '#fff', fontSize: '0.6rem', borderRadius: 3,
                }}>
                  {frame.timestamp.toFixed(0)}s
                </div>
                {frame.loading && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.7)',
                  }}>
                    <div className="spinner" style={{ width: 16, height: 16 }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Selected frame detail */}
          {selected?.result && (
            <div style={{
              padding: '16px', border: '1.5px solid #222', borderRadius: 12,
            }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#666', marginBottom: 8,
              }}>
                Frame at {selected.timestamp.toFixed(0)}s
              </div>

              <img
                src={selected.thumbnail}
                alt="Selected frame"
                style={{
                  width: '100%', borderRadius: 8, marginBottom: 12,
                  border: '1px solid #e0e0e0',
                }}
              />

              {selected.result.caption && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>Caption</div>
                  <div style={{ fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {selected.result.caption.text}
                    <ConfidenceBadge score={selected.result.caption.confidence} />
                  </div>
                </div>
              )}

              {selected.result.objects && selected.result.objects.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>Objects</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selected.result.objects.map((o, j) => (
                      <span key={j} style={{
                        padding: '2px 8px', borderRadius: 12,
                        border: '1px solid #e0e0e0', fontSize: '0.8rem',
                      }}>
                        {o.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selected.result.tags && selected.result.tags.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selected.result.tags.slice(0, 8).map((t, j) => (
                      <span key={j} style={{
                        padding: '2px 8px', borderRadius: 12,
                        background: '#f0f0f0', fontSize: '0.75rem', color: '#444',
                      }}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aggregated summary */}
          {Object.keys(objectCounts).length > 0 && (
            <div style={{
              padding: '12px 16px', background: '#fafafa', borderRadius: 8,
              border: '1px solid #e0e0e0',
            }}>
              <div style={{
                fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: '#666', marginBottom: 8,
              }}>
                Objects Across All Frames
              </div>
              <div style={{ fontSize: '0.875rem', color: '#111' }}>
                {Object.entries(objectCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, count]) => `${name} (${count})`)
                  .join(', ')}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default VideoFrameAnalysisDemo;
