import { useMemo } from 'react';
import styles from './ChannelPanel.module.css';
import { buildChannelPreviews, getChannelDescriptors } from '../../utils/color-tools';
import type { ChannelId, ChannelState } from '../../types/editor';

interface ChannelPanelProps {
  imageData: ImageData | null;
  channelState: ChannelState;
  imageModeLabel: string;
  onToggleChannel: (channelId: ChannelId) => void;
}

export default function ChannelPanel({
  imageData,
  channelState,
  imageModeLabel,
  onToggleChannel,
}: ChannelPanelProps) {
  const descriptors = useMemo(
    () => (imageData ? getChannelDescriptors(imageData) : []),
    [imageData],
  );
  const previews = useMemo(
    () => (imageData ? buildChannelPreviews(imageData) : null),
    [imageData],
  );
  const activeChannelsCount = useMemo(
    () => descriptors.filter((descriptor) => channelState[descriptor.id]).length,
    [channelState, descriptors],
  );

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h2>Каналы</h2>
        <span>
          {descriptors.length
            ? `Включено каналов: ${activeChannelsCount} из ${descriptors.length}`
            : 'Нет активных слоёв отображения'}
        </span>
        <span>
          {imageModeLabel
            ? `Режим изображения: ${imageModeLabel}`
            : 'Загрузите изображение'}
        </span>
      </div>

      {imageData && previews ? (
        <div className={styles.grid}>
          {descriptors.map((descriptor) => {
            const isActive = channelState[descriptor.id];

            return (
              <button
                key={descriptor.id}
                type="button"
                className={isActive ? styles.cardActive : styles.card}
                onClick={() => onToggleChannel(descriptor.id)}
              >
                <img
                  src={previews[descriptor.id]}
                  alt={`Канал ${descriptor.label}`}
                  className={styles.preview}
                />
                <div>
                  <span className={styles.name}>{descriptor.label}</span>
                  <span className={styles.state}>{isActive ? 'Включён' : 'Выключен'}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyState}>Каналы появятся после открытия файла.</div>
      )}
    </section>
  );
}
