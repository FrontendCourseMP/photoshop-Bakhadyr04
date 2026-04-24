import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './App.module.css';
import ChannelPanel from './components/ChannelPanel/ChannelPanel';
import ImageCanvas from './components/Canvas/ImageCanvas';
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

export default function App() {
  const {
    imageData,
    metadata,
    error,
    loading,
    hasImage,
    loadImage,
    downloadAs,
    clearImage,
  } = useImageData();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolMode>('pan');
  const [channelState, setChannelState] = useState<ChannelState>(
    createDefaultChannelState(),
  );
  const [pixelSample, setPixelSample] = useState<PixelSample | null>(null);

  useEffect(() => {
    setChannelState((current) => normalizeChannelState(imageData, current));

    if (!imageData) {
      setActiveTool('pan');
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

  const visibleImageData = useMemo(() => {
    if (!imageData) {
      return null;
    }

    return composeVisibleImageData(imageData, normalizedChannelState);
  }, [imageData, normalizedChannelState]);

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
      await loadImage(file);
    }

    event.target.value = '';
    setMenuOpen(false);
  };

  const handleDownload = async (format: ImageFormat) => {
    await downloadAs(format);
    setMenuOpen(false);
  };

  const handleClear = () => {
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
    if (!imageData) {
      return;
    }

    const nextSample = samplePixel(imageData, x, y);
    if (nextSample) {
      setPixelSample(nextSample);
    }
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
            sourceImageData={imageData}
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
      </div>
    </div>
  );
}
