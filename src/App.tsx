import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';
import ChannelPanel from './components/ChannelPanel/ChannelPanel';
import ImageCanvas from './components/Canvas/ImageCanvas';
import LevelsDialog from './components/LevelsDialog/LevelsDialog';
import MenuBar from './components/MenuBar/MenuBar';
import StatusBar from './components/StatusBar/StatusBar';
import ToolPanel from './components/ToolPanel/ToolPanel';
import { useImageData } from './hooks/useImageData';
import type { ChannelId, ChannelState, PixelSample, ToolMode } from './types/editor';
import type { ImageFormat } from './types/image';
import {
  composeVisibleImageData,
  createDefaultChannelState,
  detectImageCharacteristics,
  normalizeChannelState,
  samplePixel,
} from './utils/color-tools';
import {
  applyLevels,
  createDefaultLevelsState,
  type LevelsState,
} from './utils/levels';

export default function App() {
  const {
    imageData,
    metadata,
    error,
    loading,
    hasImage,
    loadImage,
    replaceImageData,
    downloadAs,
    clearImage,
  } = useImageData();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolMode>('pan');
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [levelsState, setLevelsState] = useState<LevelsState>(() => createDefaultLevelsState());
  const [levelsSourceImageData, setLevelsSourceImageData] = useState<ImageData | null>(null);
  const [levelsPreviewEnabled, setLevelsPreviewEnabled] = useState(false);
  const [channelState, setChannelState] = useState<ChannelState>(
    createDefaultChannelState(),
  );
  const [pixelSample, setPixelSample] = useState<PixelSample | null>(null);

  useEffect(() => {
    setChannelState(normalizeChannelState(imageData, createDefaultChannelState()));

    if (!imageData) {
      setActiveTool('pan');
      setLevelsOpen(false);
      setLevelsState(createDefaultLevelsState());
      setLevelsSourceImageData(null);
      setLevelsPreviewEnabled(false);
      setPixelSample(null);
    }
  }, [imageData]);

  useEffect(() => {
    if (activeTool === 'pan') {
      setPixelSample(null);
    }
  }, [activeTool]);

  const normalizedChannelState = useMemo(
    () => normalizeChannelState(imageData, channelState),
    [channelState, imageData],
  );

  const levelsPreviewImageData = useMemo(() => {
    if (!imageData || !levelsOpen || !levelsPreviewEnabled) {
      return null;
    }

    return applyLevels(levelsSourceImageData ?? imageData, levelsState);
  }, [imageData, levelsOpen, levelsPreviewEnabled, levelsSourceImageData, levelsState]);

  const displayImageData = levelsPreviewImageData ?? imageData;

  const visibleImageData = useMemo(() => {
    if (!displayImageData) {
      return null;
    }

    return composeVisibleImageData(displayImageData, normalizedChannelState);
  }, [displayImageData, normalizedChannelState]);

  const imageModeLabel = useMemo(() => {
    if (!imageData) {
      return '';
    }

    const characteristics = detectImageCharacteristics(imageData);
    if (characteristics.model === 'grayscale') {
      return characteristics.hasAlpha ? '2 (grayscale + alpha)' : '1 (grayscale)';
    }

    return characteristics.hasAlpha ? '4 (RGB + alpha)' : '3 (RGB)';
  }, [imageData]);

  const handleOpenDialog = () => {
    inputRef.current?.click();
    setMenuOpen(false);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setLevelsState(createDefaultLevelsState());
      setLevelsSourceImageData(null);
      setLevelsPreviewEnabled(false);
      await loadImage(file);
      setToolsOpen(true);
    }

    event.target.value = '';
    setMenuOpen(false);
  };

  const handleDownload = async (format: ImageFormat) => {
    await downloadAs(format);
    setMenuOpen(false);
  };

  const handleClear = () => {
    setLevelsState(createDefaultLevelsState());
    setLevelsSourceImageData(null);
    setLevelsPreviewEnabled(false);
    clearImage();
    setMenuOpen(false);
  };

  const handleToggleChannel = (channelId: ChannelId) => {
    setChannelState((current) => ({
      ...current,
      [channelId]: !current[channelId],
    }));
  };

  const handlePickPixel = (x: number, y: number) => {
    if (!displayImageData) {
      return;
    }

    const nextSample = samplePixel(displayImageData, x, y);
    if (nextSample) {
      setPixelSample(nextSample);
    }
  };

  const handleOpenLevels = () => {
    if (!imageData) {
      return;
    }

    if (!levelsSourceImageData) {
      setLevelsSourceImageData(imageData);
    }
    setLevelsPreviewEnabled(true);
    setLevelsOpen(true);
  };

  const handleResetLevels = () => {
    setLevelsState(createDefaultLevelsState());
  };

  const handleCancelLevels = () => {
    setLevelsPreviewEnabled(false);
    setLevelsOpen(false);
  };

  const handleApplyLevels = () => {
    if (!imageData) {
      return;
    }

    replaceImageData(applyLevels(levelsSourceImageData ?? imageData, levelsState));
    setLevelsPreviewEnabled(false);
    setLevelsOpen(false);
  };

  return (
    <div className={styles.shell}>
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="file"
        accept=".png,.jpg,.jpeg,.gb7,image/png,image/jpeg"
        onChange={handleFileChange}
      />

      <div className={styles.window}>
        <MenuBar
          menuOpen={menuOpen}
          toolsOpen={toolsOpen}
          onToggleMenu={() => setMenuOpen((previous) => !previous)}
          onCloseMenu={() => setMenuOpen(false)}
          onToggleTools={() => setToolsOpen((previous) => !previous)}
          onOpenFile={handleOpenDialog}
          onDownload={handleDownload}
          onClear={handleClear}
          hasImage={hasImage}
          loading={loading}
        />

        <main className={styles.workspace}>
          {toolsOpen ? (
            <aside className={styles.sidebar}>
              <ToolPanel
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                onOpenLevels={handleOpenLevels}
                hasImage={hasImage}
              />
              <ChannelPanel
                imageData={imageData}
                channelState={normalizedChannelState}
                imageModeLabel={imageModeLabel}
                onToggleChannel={handleToggleChannel}
              />
            </aside>
          ) : null}

          <ImageCanvas
            imageData={visibleImageData}
            sourceImageData={displayImageData}
            fileName={metadata.fileName}
            error={error}
            activeTool={activeTool}
            onPickPixel={handlePickPixel}
          />
        </main>

        <StatusBar
          metadata={metadata}
          hasImage={hasImage}
          activeTool={activeTool}
          pixelSample={pixelSample}
        />

        <LevelsDialog
          imageData={levelsSourceImageData ?? imageData}
          displayImageData={visibleImageData}
          open={levelsOpen}
          levels={levelsState}
          onLevelsChange={setLevelsState}
          onPreviewEnabledChange={setLevelsPreviewEnabled}
          onReset={handleResetLevels}
          onApply={handleApplyLevels}
          onClose={handleCancelLevels}
        />
      </div>
    </div>
  );
}
