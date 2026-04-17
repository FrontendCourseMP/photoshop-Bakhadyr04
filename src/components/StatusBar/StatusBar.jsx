import styles from './StatusBar.module.css';
import { formatFileSize } from '../../utils/image-processor';

function StatusItem({ label, value }) {
  return (
    <div className={styles.item}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
    </div>
  );
}

export default function StatusBar({ metadata, disabled, onDownload }) {
  const width = metadata?.width ? `${metadata.width}px` : '—';
  const height = metadata?.height ? `${metadata.height}px` : '—';
  const depth = metadata?.colorDepth || '—';
  const size = metadata?.fileSize ? formatFileSize(metadata.fileSize) : '—';
  const format = metadata?.format || '—';

  return (
    <footer className={styles.bar}>
      <div className={styles.details}>
        <StatusItem label="W" value={width} />
        <StatusItem label="H" value={height} />
        <StatusItem label="Depth" value={depth} />
        <StatusItem label="Size" value={size} />
        <StatusItem label="Format" value={format.toUpperCase()} />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => onDownload('png')}
          disabled={disabled}
        >
          Скачать PNG
        </button>
        <button
          type="button"
          onClick={() => onDownload('jpg')}
          disabled={disabled}
        >
          Скачать JPG
        </button>
        <button
          type="button"
          onClick={() => onDownload('gb7')}
          disabled={disabled}
        >
          Скачать GB7
        </button>
      </div>
    </footer>
  );
}
