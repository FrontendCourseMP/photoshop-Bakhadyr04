import { useState } from 'react';
import { decodeGB7 } from '../utils/gb7-decoder';
import { downloadImage, loadStandardImage, sniffFormat } from '../utils/file-handler';

const emptyMetadata = {
  width: 0,
  height: 0,
  colorDepth: '',
  format: '',
  fileSize: 0,
  fileName: '',
  hasMask: false,
};

export function useImageData() {
  const [imageData, setImageData] = useState(null);
  const [metadata, setMetadata] = useState(emptyMetadata);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearImage = () => {
    setImageData(null);
    setMetadata(emptyMetadata);
    setError('');
  };

  const loadImage = async (file) => {
    setLoading(true);
    setError('');

    try {
      const format = sniffFormat(file);
      let payload;

      if (format === 'gb7') {
        const buffer = await file.arrayBuffer();
        payload = decodeGB7(buffer);
      } else {
        payload = await loadStandardImage(file, format);
      }

      setImageData(payload.imageData);
      setMetadata({
        width: payload.width,
        height: payload.height,
        colorDepth: payload.colorDepth,
        format,
        fileSize: file.size,
        fileName: file.name.replace(/\.[^.]+$/, ''),
        hasMask: Boolean(payload.hasMask),
      });
    } catch (loadError) {
      clearImage();
      setError(loadError instanceof Error ? loadError.message : 'Не удалось прочитать файл.');
    } finally {
      setLoading(false);
    }
  };

  const downloadAs = async (format) => {
    if (!imageData) {
      return;
    }

    try {
      await downloadImage({
        imageData,
        width: metadata.width,
        height: metadata.height,
        format,
        fileName: metadata.fileName || 'image-export',
        includeMask: metadata.hasMask,
      });
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Не удалось сохранить изображение.',
      );
    }
  };

  return {
    imageData,
    metadata,
    error,
    loading,
    hasImage: Boolean(imageData),
    loadImage,
    downloadAs,
    clearImage,
  };
}
