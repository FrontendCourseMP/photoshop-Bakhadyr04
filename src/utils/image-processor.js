function ensureCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export async function imageDataFromSource(source) {
  if (source instanceof ImageData) {
    return {
      imageData: source,
      width: source.width,
      height: source.height,
    };
  }

  if (source instanceof HTMLCanvasElement) {
    const context = source.getContext('2d');
    return {
      imageData: context.getImageData(0, 0, source.width, source.height),
      width: source.width,
      height: source.height,
    };
  }

  throw new Error('Поддерживаются только ImageData и HTMLCanvasElement.');
}

export function createCanvasFromImageData(imageData, { flattenAlpha = false } = {}) {
  const canvas = ensureCanvas(imageData.width, imageData.height);
  const context = canvas.getContext('2d');
  const buffer = ensureCanvas(imageData.width, imageData.height);
  const bufferContext = buffer.getContext('2d');
  bufferContext.putImageData(imageData, 0, 0);

  if (flattenAlpha) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(buffer, 0, 0);
  } else {
    context.putImageData(imageData, 0, 0);
  }

  return canvas;
}

export function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Браузер не смог создать Blob из Canvas.'));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function formatFileSize(size) {
  if (!size) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function hasTransparentPixels(imageData) {
  const { data } = imageData;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 255) {
      return true;
    }
  }

  return false;
}
