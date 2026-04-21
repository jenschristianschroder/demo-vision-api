import React, { useState, useCallback, useMemo } from 'react';
import { analyzeImage } from '../../services/visionClient';
import { VisionResult } from '../../types';

interface GalleryImage {
  src: string;
  result?: VisionResult;
  loading?: boolean;
  error?: string;
}

// Generate placeholder gallery (in a real deployment, these would be real sample images)
const GALLERY_PATHS = Array.from({ length: 12 }, (_, i) =>
  `/samples/gallery/img-${String(i + 1).padStart(2, '0')}.jpg`,
);

const ImageSearchDemo: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>(
    GALLERY_PATHS.map((src) => ({ src })),
  );
  const [search, setSearch] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    images.forEach((img) => {
      img.result?.tags?.forEach((t) => tagSet.add(t.name));
    });
    return Array.from(tagSet).sort();
  }, [images]);

  const suggestions = useMemo(() => {
    if (!search) return [];
    return allTags.filter((t) => t.toLowerCase().includes(search.toLowerCase())).slice(0, 8);
  }, [search, allTags]);

  const filteredImages = useMemo(() => {
    if (!search) return images;
    const q = search.toLowerCase();
    return images.filter((img) =>
      img.result?.tags?.some((t) => t.name.toLowerCase().includes(q)) ||
      img.result?.caption?.text.toLowerCase().includes(q),
    );
  }, [images, search]);

  const analyzeAll = useCallback(async () => {
    setAnalyzing(true);
    const updated = [...images];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].result) continue;
      updated[i] = { ...updated[i], loading: true };
      setImages([...updated]);

      try {
        // Fetch image and convert to base64
        const resp = await fetch(updated[i].src);
        if (!resp.ok) {
          updated[i] = { ...updated[i], loading: false, error: 'Failed to load image' };
          continue;
        }
        const blob = await resp.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
        });

        const result = await analyzeImage(base64, ['tags', 'caption']);
        updated[i] = { ...updated[i], result, loading: false };
      } catch {
        updated[i] = { ...updated[i], loading: false, error: 'Analysis failed' };
      }
      setImages([...updated]);
    }
    setAnalyzing(false);
  }, [images]);

  const hasResults = images.some((img) => img.result);

  return (
    <>
      {/* Search bar */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Search by tag (e.g. car, outdoor, food)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', fontSize: '0.875rem',
            border: '1.5px solid #222', borderRadius: 8, background: '#fafafa',
            outline: 'none', minHeight: 44, boxSizing: 'border-box',
          }}
        />
        {suggestions.length > 0 && search && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10,
            maxHeight: 200, overflowY: 'auto',
          }}>
            {suggestions.map((s) => (
              <div
                key={s}
                onClick={() => setSearch(s)}
                style={{
                  padding: '10px 16px', cursor: 'pointer', fontSize: '0.875rem',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analyze button */}
      <button
        onClick={analyzeAll}
        disabled={analyzing}
        style={{
          width: '100%', padding: '12px 0', fontSize: '0.875rem', fontWeight: 600,
          background: analyzing ? '#666' : '#000', color: '#fff',
          border: 'none', borderRadius: 12, cursor: analyzing ? 'default' : 'pointer',
          minHeight: 44,
        }}
      >
        {analyzing ? 'Analyzing…' : hasResults ? 'Re-analyze All' : 'Analyze All Images'}
      </button>

      {/* Match count */}
      {search && hasResults && (
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          Showing {filteredImages.length} of {images.length} images for "{search}"
        </div>
      )}

      {/* Gallery grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      }}>
        {filteredImages.map((img, i) => (
          <div key={i} style={{
            borderRadius: 8, overflow: 'hidden',
            border: '1px solid #e0e0e0', background: '#fafafa',
          }}>
            <div style={{
              width: '100%', aspectRatio: '1', overflow: 'hidden', position: 'relative',
            }}>
              <img
                src={img.src}
                alt={img.result?.caption?.text ?? `Image ${i + 1}`}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {img.loading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.7)',
                }}>
                  <div className="spinner" />
                </div>
              )}
            </div>
            {img.result?.tags && (
              <div style={{
                padding: '6px 8px',
                display: 'flex', flexWrap: 'wrap', gap: 4,
              }}>
                {img.result.tags.slice(0, 3).map((t, j) => (
                  <span key={j} style={{
                    padding: '1px 6px', borderRadius: 8,
                    background: '#f0f0f0', fontSize: '0.65rem', color: '#444',
                  }}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && search && (
        <div style={{ textAlign: 'center', color: '#666', fontSize: '0.875rem', padding: 24 }}>
          No images match "{search}"
        </div>
      )}
    </>
  );
};

export default ImageSearchDemo;
