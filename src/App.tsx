import { useRef, useState } from 'react';
import styles from './App.module.css';
import ImageCanvas from './components/Canvas/ImageCanvas';
import MenuBar from './components/MenuBar/MenuBar';
import StatusBar from './components/StatusBar/StatusBar';
import { useImageData } from './hooks/useImageData';
import type { ImageFormat } from './types/image';

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
          onToggleMenu={() => setMenuOpen((previous) => !previous)}
          onCloseMenu={() => setMenuOpen(false)}
          onOpenFile={handleOpenDialog}
          onDownload={handleDownload}
          onClear={handleClear}
          hasImage={hasImage}
          loading={loading}
        />

        <main className={styles.workspace}>
          <ImageCanvas
            imageData={imageData}
            fileName={metadata.fileName}
            error={error}
          />
        </main>

        <StatusBar metadata={metadata} hasImage={hasImage} />
      </div>
    </div>
  );
}
