import React from 'react';

interface ConfidenceBadgeProps {
  score: number;
  label?: string;
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, label }) => {
  const pct = Math.round(score * 100);
  let bg: string;
  let color: string;

  if (score >= 0.8) {
    bg = '#e8f5e9';
    color = '#2e7d32';
  } else if (score >= 0.5) {
    bg = '#fff8e1';
    color = '#f57f17';
  } else {
    bg = '#ffebee';
    color = '#c62828';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: '0.75rem',
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {label && <span>{label}</span>}
      <span>{pct}%</span>
    </span>
  );
};

export default ConfidenceBadge;
