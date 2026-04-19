import { useEffect, useRef } from 'react';
import styles from './MenuBar.module.css';
import type { ImageFormat } from '../../types/image';

interface MenuBarProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onOpenFile: () => void;
  onDownload: (format: ImageFormat) => void;
  onClear: () => void;
  hasImage: boolean;
  loading: boolean;
}

export default function MenuBar({
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpenFile,
  onDownload,
  onClear,
  hasImage,
  loading,
}: MenuBarProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onCloseMenu();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseMenu();
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, onCloseMenu]);

  return (
    <header className={styles.bar}>
      <div className={styles.leftSection}>
        <div ref={menuRef} className={styles.menuRoot}>
          <button
            type="button"
            className={`${styles.menuButton} ${menuOpen ? styles.menuButtonActive : ''}`}
            onClick={onToggleMenu}
          >
            Файл
          </button>

          {menuOpen ? (
            <div className={styles.dropdown}>
              <button type="button" onClick={onOpenFile}>
                Открыть...
              </button>
              <div className={styles.separator} />
              <button
                type="button"
                onClick={() => onDownload('png')}
                disabled={!hasImage || loading}
              >
                Сохранить как PNG
              </button>
              <button
                type="button"
                onClick={() => onDownload('jpg')}
                disabled={!hasImage || loading}
              >
                Сохранить как JPG
              </button>
              <button
                type="button"
                onClick={() => onDownload('gb7')}
                disabled={!hasImage || loading}
              >
                Сохранить как GB7
              </button>
              <div className={styles.separator} />
              <button
                type="button"
                onClick={onClear}
                disabled={!hasImage || loading}
              >
                Закрыть файл
              </button>
            </div>
          ) : null}
        </div>

      </div>

      {/* <div className={styles.rightSection}>
        <span>{loading ? 'Чтение файла...' : 'Готово'}</span>
      </div> */}
      <div className={styles.appLabel}>Image Editor</div>

    </header>
  );
}
