import { useState } from 'react';
import { decodeGB7 } from '../utils/gb7-decoder';
import { downloadImage, loadStandardImage, sniffFormat } from '../utils/file-handler';
import type { ImageFormat, ImageMetadata } from '../types/image';

const emptyMetadata: ImageMetadata = {
  width: 0,
  height: 0,
  colorDepth: '',
  format: '',
  fileSize: 0,
  fileName: '',
  hasMask: false,
};

interface UseImageDataResult {
  imageData: ImageData | null;
  metadata: ImageMetadata;
  error: string;
  loading: boolean;
  hasImage: boolean;
  loadImage: (file: File) => Promise<void>;
  downloadAs: (format: ImageFormat) => Promise<void>;
  clearImage: () => void;
}

export function useImageData(): UseImageDataResult {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [metadata, setMetadata] = useState<ImageMetadata>(emptyMetadata);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clearImage = () => {
    setImageData(null);
    setMetadata(emptyMetadata);
    setError('');
  };

  const loadImage = async (file: File) => {
    setLoading(true);
    setError('');

    try {
      const format = sniffFormat(file);
      const payload =
        format === 'gb7'
          ? decodeGB7(await file.arrayBuffer())
          : await loadStandardImage(file, format);

      setImageData(payload.imageData);
      setMetadata({
        width: payload.width,
        height: payload.height,
        colorDepth: payload.colorDepth,
        format,
        fileSize: file.size,
        fileName: file.name.replace(/\.[^.]+$/, ''),
        hasMask: payload.hasMask,
      });
    } catch (loadError) {
      clearImage();
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Не удалось прочитать файл.',
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadAs = async (format: ImageFormat) => {
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
      setError('');
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
