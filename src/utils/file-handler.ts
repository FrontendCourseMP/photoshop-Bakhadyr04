import type { DownloadRequest, ImageFormat, LoadedImagePayload } from '../types/image';
import { encodeGB7 } from './gb7-encoder';
import {
  canvasToBlob,
  createCanvasFromImageData,
  downloadBlob,
  hasTransparentPixels,
} from './image-processor';

const ACCEPTED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gb7'] as const;
const ACCEPTED_MIME: Record<ImageFormat, string[]> = {
  png: ['image/png'],
  jpg: ['image/jpeg'],
  gb7: ['application/octet-stream', ''],
};

export function sniffFormat(file: File): ImageFormat {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !ACCEPTED_EXTENSIONS.includes(extension as (typeof ACCEPTED_EXTENSIONS)[number])) {
    throw new Error('Поддерживаются только файлы PNG, JPG/JPEG и GB7.');
  }

  const normalized = (extension === 'jpeg' ? 'jpg' : extension) as ImageFormat;
  const expectedMime = ACCEPTED_MIME[normalized];

  if (
    file.type &&
    expectedMime &&
    !expectedMime.includes(file.type) &&
    normalized !== 'gb7'
  ) {
    throw new Error(`Файл ${file.name} не соответствует ожидаемому MIME-типу.`);
  }

  return normalized;
}

export async function loadStandardImage(
  file: File,
  format: Extract<ImageFormat, 'png' | 'jpg'>,
): Promise<LoadedImagePayload> {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    bitmap.close?.();
    throw new Error('Не удалось получить 2D-контекст для чтения изображения.');
  }

  context.drawImage(bitmap, 0, 0);
  const imageData = context.getImageData(0, 0, width, height);
  const hasMask = format === 'png' ? hasTransparentPixels(imageData) : false;
  bitmap.close?.();

  return {
    imageData,
    width,
    height,
    hasMask,
    colorDepth: format === 'png' ? (hasMask ? '32-bit RGBA' : '24-bit RGB') : '24-bit RGB',
  };
}

export async function downloadImage({
  imageData,
  width,
  height,
  format,
  fileName,
  includeMask,
}: DownloadRequest): Promise<void> {
  let blob: Blob;
  let extension: ImageFormat;
  const resolvedWidth = width || imageData.width || 0;
  const resolvedHeight = height || imageData.height || 0;

  if (!imageData || !resolvedWidth || !resolvedHeight) {
    throw new Error('Нет изображения для сохранения.');
  }

  switch (format) {
    case 'png': {
      const canvas = createCanvasFromImageData(imageData);
      blob = await canvasToBlob(canvas, 'image/png');
      extension = 'png';
      break;
    }
    case 'jpg': {
      const canvas = createCanvasFromImageData(imageData, { flattenAlpha: true });
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
      extension = 'jpg';
      break;
    }
    case 'gb7': {
      blob = await encodeGB7(imageData, includeMask);
      extension = 'gb7';
      break;
    }
    default:
      throw new Error(`Неподдерживаемый формат сохранения: ${format}.`);
  }

  downloadBlob(blob, `${fileName || 'image-export'}.${extension}`);
}
