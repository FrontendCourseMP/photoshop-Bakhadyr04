import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './LevelsDialog.module.css';
import {
  buildHistogram,
  createDefaultLevelsState,
  drawHistogramPath,
  gammaToMarker,
  levelChannels,
  markerToGamma,
  normalizeLevelsRange,
  type HistogramMode,
  type LevelsChannel,
  type LevelsRange,
  type LevelsState,
} from '../../utils/levels';

interface LevelsDialogProps {
  imageData: ImageData | null;
  displayImageData: ImageData | null;
  open: boolean;
  levels: LevelsState;
  onLevelsChange: (levels: LevelsState) => void;
  onPreviewEnabledChange: (enabled: boolean) => void;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
}

const histogramWidth = 512;
const histogramHeight = 190;
const previewWidth = 280;
const previewHeight = 240;

function formatGamma(value: number): string {
  return value.toFixed(2).replace(/0$/, '').replace(/\.0$/, '.0');
}

export default function LevelsDialog({
  imageData,
  displayImageData,
  open,
  levels,
  onLevelsChange,
  onPreviewEnabledChange,
  onReset,
  onApply,
  onClose,
}: LevelsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const histogramRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<LevelsChannel>('master');
  const [histogramMode, setHistogramMode] = useState<HistogramMode>('linear');
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const currentRange = levels[selectedChannel];
  const midpointMarker = gammaToMarker(
    currentRange.gamma,
    currentRange.black,
    currentRange.white,
  );
  const blackPosition = (currentRange.black / 255) * 100;
  const midpointPosition = (midpointMarker / 255) * 100;
  const whitePosition = (currentRange.white / 255) * 100;

  const histogram = useMemo(() => {
    if (!imageData) {
      return null;
    }

    return buildHistogram(imageData, selectedChannel);
  }, [imageData, selectedChannel]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      setSelectedChannel('master');
      setHistogramMode('linear');
      setPreviewEnabled(true);
      onPreviewEnabledChange(true);
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [onPreviewEnabledChange, open]);

  useEffect(() => {
    const canvas = histogramRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !histogram) {
      return;
    }

    const width = Math.max(1, Math.round(canvas.parentElement?.clientWidth ?? histogramWidth));
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = histogramHeight * ratio;
    canvas.style.width = '100%';
    canvas.style.height = `${histogramHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawHistogramPath(context, histogram, histogramMode, width, histogramHeight);
  }, [histogram, histogramMode]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !displayImageData) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    canvas.width = previewWidth * ratio;
    canvas.height = previewHeight * ratio;
    canvas.style.width = `${previewWidth}px`;
    canvas.style.height = `${previewHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, previewWidth, previewHeight);

    const buffer = document.createElement('canvas');
    buffer.width = displayImageData.width;
    buffer.height = displayImageData.height;
    const bufferContext = buffer.getContext('2d');
    if (!bufferContext) {
      return;
    }

    bufferContext.putImageData(displayImageData, 0, 0);
    const scale = Math.min(
      previewWidth / displayImageData.width,
      previewHeight / displayImageData.height,
    );
    const drawWidth = Math.max(1, displayImageData.width * scale);
    const drawHeight = Math.max(1, displayImageData.height * scale);
    const left = (previewWidth - drawWidth) / 2;
    const top = (previewHeight - drawHeight) / 2;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(buffer, left, top, drawWidth, drawHeight);
  }, [displayImageData]);

  const updateRange = (patch: Partial<LevelsRange>) => {
    const nextRange = normalizeLevelsRange({
      ...levels[selectedChannel],
      ...patch,
    });

    onLevelsChange({
      ...levels,
      [selectedChannel]: nextRange,
    });
  };

  const handleBlackChange = (value: number) => {
    updateRange({
      black: Math.min(value, currentRange.white - 2),
    });
  };

  const handleWhiteChange = (value: number) => {
    updateRange({
      white: Math.max(value, currentRange.black + 2),
    });
  };

  const handleMidpointChange = (value: number) => {
    updateRange({
      gamma: markerToGamma(value, currentRange.black, currentRange.white),
    });
  };

  const handleReset = () => {
    onReset();
  };

  const handleCancel = () => {
    onPreviewEnabledChange(false);
    onClose();
  };

  const handleApply = () => {
    if (!imageData) {
      return;
    }

    onApply();
    onClose();
  };

  const handlePreviewToggle = (checked: boolean) => {
    setPreviewEnabled(checked);
    onPreviewEnabledChange(checked);
  };

  const valueFromPointer = (clientX: number): number => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) {
      return 0;
    }

    const normalized = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return normalized * 255;
  };

  const startDrag = (
    marker: 'black' | 'gamma' | 'white',
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    const handleDrag = (clientX: number) => {
      const value = valueFromPointer(clientX);
      if (marker === 'black') {
        handleBlackChange(value);
      } else if (marker === 'white') {
        handleWhiteChange(value);
      } else {
        handleMidpointChange(
          Math.min(currentRange.white - 1, Math.max(currentRange.black + 1, value)),
        );
      }
    };

    handleDrag(event.clientX);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        handleCancel();
      }}
    >
      <form method="dialog" className={styles.content}>
        <header className={styles.header}>
          <div>
            <h2>Уровни</h2>
            <span>Гистограмма и градационная коррекция</span>
          </div>
          <button type="button" className={styles.iconButton} onClick={handleCancel}>
            x
          </button>
        </header>

        <div className={styles.controlsRow}>
          <label className={styles.field}>
            <span>Канал</span>
            <select
              value={selectedChannel}
              onChange={(event) => setSelectedChannel(event.target.value as LevelsChannel)}
            >
              {levelChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Масштаб</span>
            <select
              value={histogramMode}
              onChange={(event) => setHistogramMode(event.target.value as HistogramMode)}
            >
              <option value="linear">Линейный</option>
              <option value="logarithmic">Логарифмический</option>
            </select>
          </label>

          <label className={styles.previewToggle}>
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(event) => handlePreviewToggle(event.target.checked)}
            />
            <span>Предпросмотр</span>
          </label>
        </div>

        <section className={styles.previewLayout}>
          <div className={styles.histogramBlock}>
            <canvas ref={histogramRef} className={styles.histogram} />
            <div className={styles.axis}>
              <span>0</span>
              <span>127</span>
              <span>255</span>
            </div>
            <div ref={sliderRef} className={styles.levelTrack} aria-label="Input Levels">
              <div className={styles.trackGradient} />
              <div
                className={styles.activeRange}
                style={{
                  left: `${blackPosition}%`,
                  right: `${100 - whitePosition}%`,
                }}
              />
              <button
                type="button"
                className={`${styles.marker} ${styles.blackMarker}`}
                style={{ left: `${blackPosition}%` }}
                aria-label="Black point"
                onPointerDown={(event) => startDrag('black', event)}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    handleBlackChange(valueFromPointer(event.clientX));
                  }
                }}
              />
              <button
                type="button"
                className={`${styles.marker} ${styles.gammaMarker}`}
                style={{ left: `${midpointPosition}%` }}
                aria-label="Gamma midpoint"
                onPointerDown={(event) => startDrag('gamma', event)}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    handleMidpointChange(valueFromPointer(event.clientX));
                  }
                }}
              />
              <button
                type="button"
                className={`${styles.marker} ${styles.whiteMarker}`}
                style={{ left: `${whitePosition}%` }}
                aria-label="White point"
                onPointerDown={(event) => startDrag('white', event)}
                onPointerMove={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    handleWhiteChange(valueFromPointer(event.clientX));
                  }
                }}
              />
            </div>
          </div>

          <aside className={styles.previewPanel}>
            <canvas ref={previewCanvasRef} className={styles.previewCanvas} />
          </aside>
        </section>

        <section className={styles.numericGrid}>
          <label>
            <span>Черный</span>
            <input
              type="number"
              min="0"
              max="253"
              value={currentRange.black}
              onChange={(event) => handleBlackChange(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Гамма</span>
            <input
              type="number"
              min="0.1"
              max="9.9"
              step="0.01"
              value={formatGamma(currentRange.gamma)}
              onChange={(event) => updateRange({ gamma: Number(event.target.value) })}
            />
          </label>
          <label>
            <span>Белый</span>
            <input
              type="number"
              min="2"
              max="255"
              value={currentRange.white}
              onChange={(event) => handleWhiteChange(Number(event.target.value))}
            />
          </label>
        </section>

        <footer className={styles.footer}>
          <button type="button" className={styles.secondaryButton} onClick={handleReset}>
            Сброс
          </button>
          <div className={styles.footerActions}>
            <button type="button" className={styles.secondaryButton} onClick={handleCancel}>
              Отмена
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleApply}
              disabled={!imageData}
            >
              Применить
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
