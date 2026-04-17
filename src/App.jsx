import styles from './App.module.css';
import ImageUploader from './components/ImageUploader/ImageUploader';
import ImageCanvas from './components/Canvas/ImageCanvas';
import StatusBar from './components/StatusBar/StatusBar';
import { useImageData } from './hooks/useImageData';

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

  return (
    <div className={styles.shell}>
      <div className={styles.app}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Лабораторная работа 1</p>
            <h1>Цифровое представление изображения</h1>
            <p className={styles.subtitle}>
              Загружайте PNG, JPG и GB7, просматривайте изображение на Canvas и
              выгружайте результат в любом из трёх форматов.
            </p>
          </div>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={clearImage}
            disabled={!hasImage || loading}
          >
            Очистить
          </button>
        </header>

        <main className={styles.content}>
          <section className={styles.leftColumn}>
            <ImageUploader
              onFileSelect={loadImage}
              loading={loading}
              error={error}
            />
            <div className={styles.infoCard}>
              <h2>Формат GB7</h2>
              <p>
                GrayBit-7 хранит 7-битный уровень серого в каждом пикселе и
                может использовать старший бит как бинарную маску прозрачности.
              </p>
            </div>
          </section>

          <section className={styles.viewerColumn}>
            <ImageCanvas imageData={imageData} loading={loading} />
          </section>
        </main>
      </div>

      <StatusBar
        metadata={metadata}
        disabled={!hasImage || loading}
        onDownload={downloadAs}
      />
    </div>
  );
}
