import React from 'react';

interface SampleImagePickerProps {
  samples: string[];
  onSelect: (src: string) => void;
}

const SampleImagePicker: React.FC<SampleImagePickerProps> = ({ samples, onSelect }) => {
  if (!samples.length) return null;

  return (
    <div>
      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#666666',
        marginBottom: 8,
      }}>
        Or try a sample
      </div>
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {samples.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Sample ${i + 1}`}
            onClick={() => onSelect(src)}
            style={{
              width: 64,
              height: 64,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1.5px solid #e0e0e0',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SampleImagePicker;
