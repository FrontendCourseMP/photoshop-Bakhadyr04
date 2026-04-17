import { useRef, useState } from 'react';
import styles from './ImageUploader.module.css';

export default function ImageUploader({ onFileSelect, loading, error }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const handleFiles = (files) => {
    const [file] = files || [];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleInputChange = (event) => {
    handleFiles(event.target.files);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div className={styles.panel}>
      <div
        className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
          }
        }}
        onClick={openFilePicker}
      >
        <div className={styles.badge}>PNG / JPG / GB7</div>
        <h2>Загрузите изображение</h2>
        <p>
          Перетащите файл в область ниже или выберите его вручную. Поддерживаются
          изображения браузера и пользовательский формат GrayBit-7.
        </p>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={(event) => {
            event.stopPropagation();
            openFilePicker();
          }}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : 'Выбрать файл'}
        </button>
        <input
          ref={inputRef}
          className={styles.input}
          type="file"
          accept=".png,.jpg,.jpeg,.gb7,image/png,image/jpeg"
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      <div className={styles.hints}>
        <span>Drag & drop</span>
        <span>Проверка формата</span>
        <span>Декодирование GB7</span>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
