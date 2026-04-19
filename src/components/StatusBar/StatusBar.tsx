import styles from './StatusBar.module.css';
import { formatFileSize } from '../../utils/image-processor';
import type { ImageMetadata } from '../../types/image';

interface StatusBarProps {
  metadata: ImageMetadata;
  hasImage: boolean;
}

function formatDimension(value: number): string {
  return value ? `${value}px` : '—';
}

export default function StatusBar({ metadata, hasImage }: StatusBarProps) {
  return (
    <footer className={styles.bar}>
      <span>{metadata.fileName || 'Нет открытого файла'}</span>
      <span>{hasImage ? formatDimension(metadata.width) : '—'}</span>
      <span>{hasImage ? formatDimension(metadata.height) : '—'}</span>
      <span>{metadata.colorDepth || '—'}</span>
      <span>{metadata.fileSize ? formatFileSize(metadata.fileSize) : '—'}</span>
      <span>{metadata.format ? metadata.format.toUpperCase() : '—'}</span>
    </footer>
  );
}
