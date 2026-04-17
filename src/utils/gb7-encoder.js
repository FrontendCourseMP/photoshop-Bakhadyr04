import { imageDataFromSource } from './image-processor';
import { GB7_SIGNATURE, HEADER_SIZE } from './gb7-decoder';

function compress8BitTo7Bit(gray) {
  return Math.round((gray / 255) * 127);
}

export async function encodeGB7(source, includeMask = false) {
  const { imageData, width, height } = await imageDataFromSource(source);

  if (width > 0xffff || height > 0xffff) {
    throw new Error('GB7 поддерживает только размеры до 65535x65535 пикселей.');
  }

  const pixelCount = width * height;
  const buffer = new ArrayBuffer(HEADER_SIZE + pixelCount);
  const view = new DataView(buffer);
  const output = new Uint8Array(buffer, HEADER_SIZE);
  const input = imageData.data;

  GB7_SIGNATURE.forEach((byte, index) => view.setUint8(index, byte));
  view.setUint8(4, 0x01);
  view.setUint8(5, includeMask ? 0x01 : 0x00);
  view.setUint16(6, width, false);
  view.setUint16(8, height, false);
  view.setUint16(10, 0x0000, false);

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const red = input[offset];
    const green = input[offset + 1];
    const blue = input[offset + 2];
    const alpha = input[offset + 3];
    const luminance = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);
    const gray7 = compress8BitTo7Bit(luminance) & 0x7f;
    const maskBit = includeMask && alpha >= 128 ? 0x80 : 0x00;

    output[index] = gray7 | maskBit;
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}
