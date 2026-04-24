import styles from './ToolPanel.module.css';
import type { ToolMode } from '../../types/editor';

interface ToolPanelProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  hasImage: boolean;
}

export default function ToolPanel({
  activeTool,
  onSelectTool,
  hasImage,
}: ToolPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2>Инструменты</h2>
        <span>{activeTool === 'eyedropper' ? 'Пипетка активна' : 'Навигация'}</span>
      </div>

      <div className={styles.buttons}>
        <button
          type="button"
          className={activeTool === 'pan' ? styles.buttonActive : styles.button}
          onClick={() => onSelectTool('pan')}
        >
          Курсор
        </button>
        <button
          type="button"
          className={activeTool === 'eyedropper' ? styles.buttonActive : styles.button}
          onClick={() => onSelectTool('eyedropper')}
          disabled={!hasImage}
        >
          Пипетка
        </button>
      </div>
    </section>
  );
}
