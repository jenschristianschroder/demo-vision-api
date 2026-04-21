import React, { useRef, useEffect, useCallback } from 'react';
import { BoundingBox } from '../types';
import './ImageCanvas.css';

const COLORS = [
  '#0078d4', '#e74c3c', '#2ecc71', '#f39c12',
  '#9b59b6', '#1abc9c', '#e67e22', '#3498db',
  '#e91e63', '#00bcd4', '#8bc34a', '#ff5722',
];

export interface CanvasBoundingBox {
  boundingBox: BoundingBox;
  label?: string;
  confidence?: number;
  color?: string;
}

export interface CanvasTextOverlay {
  text: string;
  boundingPolygon: Array<{ x: number; y: number }>;
}

interface ImageCanvasProps {
  imageSrc: string;
  boundingBoxes?: CanvasBoundingBox[];
  textOverlays?: CanvasTextOverlay[];
  highlightIndex?: number;
  onBoxClick?: (index: number) => void;
  showLabels?: boolean;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageSrc,
  boundingBoxes = [],
  textOverlays = [],
  highlightIndex,
  onBoxClick,
  showLabels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const containerWidth = canvas.parentElement?.clientWidth ?? img.naturalWidth;
    const scale = containerWidth / img.naturalWidth;
    scaleRef.current = scale;

    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    boundingBoxes.forEach((box, i) => {
      const color = box.color ?? COLORS[i % COLORS.length];
      const isHighlighted = highlightIndex === i;
      const { x, y, w, h } = box.boundingBox;

      ctx.strokeStyle = color;
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.strokeRect(x * scale, y * scale, w * scale, h * scale);

      // Semi-transparent fill
      ctx.fillStyle = color + (isHighlighted ? '30' : '15');
      ctx.fillRect(x * scale, y * scale, w * scale, h * scale);

      if (showLabels && box.label) {
        const labelText = box.confidence != null
          ? `${box.label} (${Math.round(box.confidence * 100)}%)`
          : box.label;
        ctx.font = `${Math.max(11, 13 * scale)}px -apple-system, sans-serif`;
        const metrics = ctx.measureText(labelText);
        const labelH = 18 * scale;
        const labelY = y * scale - labelH;

        ctx.fillStyle = color;
        ctx.fillRect(x * scale, labelY, metrics.width + 8 * scale, labelH);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, x * scale + 4 * scale, labelY + labelH - 4 * scale);
      }
    });

    // Draw text overlays
    textOverlays.forEach((overlay) => {
      if (overlay.boundingPolygon.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(overlay.boundingPolygon[0].x * scale, overlay.boundingPolygon[0].y * scale);
      for (let j = 1; j < overlay.boundingPolygon.length; j++) {
        ctx.lineTo(overlay.boundingPolygon[j].x * scale, overlay.boundingPolygon[j].y * scale);
      }
      ctx.closePath();
      ctx.strokeStyle = '#0078d4';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 120, 212, 0.08)';
      ctx.fill();
    });
  }, [boundingBoxes, textOverlays, highlightIndex, showLabels]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    img.src = imageSrc;
  }, [imageSrc, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onBoxClick || !boundingBoxes.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scale = scaleRef.current;

    for (let i = boundingBoxes.length - 1; i >= 0; i--) {
      const { x, y, w, h } = boundingBoxes[i].boundingBox;
      if (
        mx >= x * scale && mx <= (x + w) * scale &&
        my >= y * scale && my <= (y + h) * scale
      ) {
        onBoxClick(i);
        return;
      }
    }
  };

  return (
    <div className="image-canvas-wrapper">
      <canvas ref={canvasRef} onClick={handleClick} />
    </div>
  );
};

export default ImageCanvas;
