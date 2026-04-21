import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FEATURES } from '../types';
import './FeaturesScreen.css';

const FeaturesScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="features-container">
      <h1 className="features-title">Demos</h1>
      <p className="features-subtitle">Select a capability to explore</p>
      <div className="features-list">
        {FEATURES.map((f) => (
          <div
            key={f.id}
            className="feature-card"
            onClick={() => navigate(`/demo/${f.id}`)}
          >
            <span className="feature-card-label">{f.label}</span>
            <span className="feature-card-desc">{f.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturesScreen;
