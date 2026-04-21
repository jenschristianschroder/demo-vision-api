import React from 'react';
import { useParams } from 'react-router-dom';
import { FEATURES, VisionFeature } from '../types';
import ImageCaptioningDemo from './demos/ImageCaptioningDemo';
import DenseCaptionsDemo from './demos/DenseCaptionsDemo';
import ObjectDetectionDemo from './demos/ObjectDetectionDemo';
import ImageTaggingDemo from './demos/ImageTaggingDemo';
import SmartCropDemo from './demos/SmartCropDemo';
import OcrTextDemo from './demos/OcrTextDemo';
import ReceiptLabelDemo from './demos/ReceiptLabelDemo';
import DiagramWhiteboardDemo from './demos/DiagramWhiteboardDemo';
import BrandSafetyDemo from './demos/BrandSafetyDemo';
import FaceDetectionDemo from './demos/FaceDetectionDemo';
import AltTextDemo from './demos/AltTextDemo';
import ImageSearchDemo from './demos/ImageSearchDemo';
import VideoFrameAnalysisDemo from './demos/VideoFrameAnalysisDemo';
import './DemoScreen.css';

const DEMO_COMPONENTS: Record<VisionFeature, React.FC> = {
  imageCaptioning: ImageCaptioningDemo,
  denseCaptions: DenseCaptionsDemo,
  objectDetection: ObjectDetectionDemo,
  imageTagging: ImageTaggingDemo,
  smartCrop: SmartCropDemo,
  ocrText: OcrTextDemo,
  receiptLabel: ReceiptLabelDemo,
  diagramWhiteboard: DiagramWhiteboardDemo,
  brandSafety: BrandSafetyDemo,
  faceDetection: FaceDetectionDemo,
  altText: AltTextDemo,
  imageSearch: ImageSearchDemo,
  videoFrameAnalysis: VideoFrameAnalysisDemo,
};

const DemoScreen: React.FC = () => {
  const { feature } = useParams<{ feature: string }>();
  const featureInfo = FEATURES.find((f) => f.id === feature);
  const DemoComponent = feature ? DEMO_COMPONENTS[feature as VisionFeature] : undefined;

  if (!featureInfo || !DemoComponent) {
    return (
      <div className="demo-container">
        <p>Demo not found.</p>
      </div>
    );
  }

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1 className="demo-title">{featureInfo.label}</h1>
      </div>
      <p className="demo-description">{featureInfo.description}</p>
      <div className="demo-content">
        <DemoComponent />
      </div>
    </div>
  );
};

export default DemoScreen;
