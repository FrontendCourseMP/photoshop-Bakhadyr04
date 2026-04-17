import { useEffect, useRef, useState } from 'react';
import styles from './ImageCanvas.module.css';

export default function ImageCanvas({ imageData, loading }) {
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

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
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, drawWidth, drawHeight);
    context.imageSmoothingEnabled = false;

    const buffer = document.createElement('canvas');
    buffer.width = imageData.width;
    buffer.height = imageData.height;

    const bufferContext = buffer.getContext('2d');
    bufferContext.putImageData(imageData, 0, 0);
    context.drawImage(buffer, 0, 0, drawWidth, drawHeight);
  }, [imageData, viewport]);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <p className={styles.overline}>Canvas Preview</p>
          <h2>Адаптивное отображение изображения</h2>
        </div>
      </div>

      <div ref={frameRef} className={styles.stage}>
        {imageData ? (
          <canvas ref={canvasRef} className={styles.canvas} />
        ) : (
          <div className={styles.placeholder}>
            <p>{loading ? 'Подготавливаем изображение...' : 'Изображение пока не загружено'}</p>
            <span>
              Canvas автоматически сохраняет пропорции и адаптируется под
              ширину экрана.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
