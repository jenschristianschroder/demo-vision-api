import React from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeScreen.css';

const WelcomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <h1 className="welcome-title">Vision API</h1>
      <p className="welcome-subtitle">
        Explore Azure AI Vision capabilities — from image captioning and OCR
        to object detection and content safety.
      </p>
      <button className="welcome-cta" onClick={() => navigate('/features')}>
        Try the Demos
      </button>
      <div className="welcome-footer">Microsoft Innovation Hub Denmark</div>
    </div>
  );
};

export default WelcomeScreen;
