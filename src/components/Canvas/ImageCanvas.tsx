import { useEffect, useRef, useState } from 'react';
import styles from './ImageCanvas.module.css';

interface ImageCanvasProps {
  imageData: ImageData | null;
  fileName: string;
  error: string;
}

interface ViewportSize {
  width: number;
  height: number;
}

export default function ImageCanvas({
  imageData,
  fileName,
  error,
}: ImageCanvasProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setViewport({ width, height });
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData || !viewport.width || !viewport.height) {
      return;
    }

    const ratio = imageData.width / imageData.height;
    const viewportRatio = viewport.width / viewport.height;

    let drawWidth = viewport.width;
    let drawHeight = viewport.width / ratio;

    if (viewportRatio > ratio) {
      drawHeight = viewport.height;
      drawWidth = viewport.height * ratio;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.round(drawWidth * devicePixelRatio);
    canvas.height = Math.round(drawHeight * devicePixelRatio);
    canvas.style.width = `${drawWidth}px`;
    canvas.style.height = `${drawHeight}px`;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, drawWidth, drawHeight);
    context.imageSmoothingEnabled = false;

    const buffer = document.createElement('canvas');
    buffer.width = imageData.width;
    buffer.height = imageData.height;
    const bufferContext = buffer.getContext('2d');
    if (!bufferContext) {
      return;
    }

    bufferContext.putImageData(imageData, 0, 0);
    context.drawImage(buffer, 0, 0, drawWidth, drawHeight);
  }, [imageData, viewport]);

  return (
    <section className={styles.panel}>
      <div className={styles.topline}>
        {/* <span>{fileName || 'Без имени'}</span>
        <span>{imageData ? `${imageData.width} × ${imageData.height}` : 'Нет файла'}</span> */}
      </div>

      <div ref={frameRef} className={styles.stage}>
        {imageData ? (
          <canvas ref={canvasRef} className={styles.canvas} />
        ) : (
          <div className={styles.emptyState}>
            <p>Откройте PNG, JPG или GB7 через меню «Файл»</p>
            {error ? <span>{error}</span> : null}
          </div>
        )}
      </div>

      {imageData && error ? <div className={styles.inlineError}>{error}</div> : null}
    </section>
  );
}
