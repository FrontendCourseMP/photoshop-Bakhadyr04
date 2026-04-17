const GB7_SIGNATURE = [0x47, 0x42, 0x37, 0x1d];
const HEADER_SIZE = 12;

function expand7BitTo8Bit(value) {
  return Math.round((value / 127) * 255);
}

export function decodeGB7(buffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error('GB7 decoder expects an ArrayBuffer.');
  }

  if (buffer.byteLength < HEADER_SIZE) {
    throw new Error('GB7 file is too small to contain a valid header.');
  }

  const view = new DataView(buffer);

  GB7_SIGNATURE.forEach((expected, index) => {
    if (view.getUint8(index) !== expected) {
      throw new Error('Некорректная сигнатура GB7 файла.');
    }
  });

  const version = view.getUint8(4);
  if (version !== 0x01) {
    throw new Error(`Неподдерживаемая версия GB7: ${version}.`);
  }

  const flags = view.getUint8(5);
  const hasMask = (flags & 0x01) === 0x01;
  const width = view.getUint16(6, false);
  const height = view.getUint16(8, false);
  const reserved = view.getUint16(10, false);

  if (!width || !height) {
    throw new Error('GB7 файл содержит нулевые размеры изображения.');
  }

  if (reserved !== 0x0000) {
    throw new Error('Некорректное зарезервированное поле в заголовке GB7.');
  }

  const pixelCount = width * height;
  const expectedLength = HEADER_SIZE + pixelCount;

  if (buffer.byteLength !== expectedLength) {
    throw new Error(
      `Размер GB7 файла не совпадает с заголовком: ожидалось ${expectedLength} байт.`,
    );
  }

  const pixels = new Uint8ClampedArray(pixelCount * 4);
  const input = new Uint8Array(buffer, HEADER_SIZE);

  for (let index = 0; index < pixelCount; index += 1) {
    const value = input[index];
    const gray = expand7BitTo8Bit(value & 0x7f);
    const alpha = hasMask ? ((value & 0x80) !== 0 ? 255 : 0) : 255;
    const outputOffset = index * 4;

    pixels[outputOffset] = gray;
    pixels[outputOffset + 1] = gray;
    pixels[outputOffset + 2] = gray;
    pixels[outputOffset + 3] = alpha;
  }

  return {
    imageData: new ImageData(pixels, width, height),
    width,
    height,
    hasMask,
    colorDepth: hasMask ? '7-bit + 1-bit mask' : '7-bit grayscale',
  };
}

export { GB7_SIGNATURE, HEADER_SIZE };
