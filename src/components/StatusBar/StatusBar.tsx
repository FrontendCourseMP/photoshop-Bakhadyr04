import styles from './StatusBar.module.css';
import { formatFileSize } from '../../utils/image-processor';
import type { PixelSample, ToolMode } from '../../types/editor';
import type { ImageMetadata } from '../../types/image';

interface StatusBarProps {
  metadata: ImageMetadata;
  hasImage: boolean;
  activeTool: ToolMode;
  pixelSample: PixelSample | null;
}

function formatDimension(value: number): string {
  return value ? `${value}px` : '—';
}

function formatLab(value: number): string {
  return value.toFixed(2);
}

export default function StatusBar({
  metadata,
  hasImage,
  activeTool,
  pixelSample,
}: StatusBarProps) {
  return (
    <footer className={styles.bar}>
      <span>{metadata.fileName || 'Нет открытого файла'}</span>
      <span>{hasImage ? formatDimension(metadata.width) : '—'}</span>
      <span>{hasImage ? formatDimension(metadata.height) : '—'}</span>
      <span>{metadata.colorDepth || '—'}</span>
      <span>{metadata.fileSize ? formatFileSize(metadata.fileSize) : '—'}</span>
      <span>{metadata.format ? metadata.format.toUpperCase() : '—'}</span>
      <span>{activeTool === 'eyedropper' ? 'Пипетка' : 'Курсор'}</span>
      {pixelSample ? (
        <>
          <span>{`X: ${pixelSample.x}, Y: ${pixelSample.y}`}</span>
          <span>{`RGB: ${pixelSample.rgb.r}, ${pixelSample.rgb.g}, ${pixelSample.rgb.b}`}</span>
          <span>
            {`LAB: ${formatLab(pixelSample.lab.l)}, ${formatLab(pixelSample.lab.a)}, ${formatLab(pixelSample.lab.b)}`}
          </span>
        </>
      ) : (
        <span>{activeTool === 'eyedropper' ? 'Кликните по изображению' : 'Пиксель не выбран'}</span>
      )}
    </footer>
  );
}
