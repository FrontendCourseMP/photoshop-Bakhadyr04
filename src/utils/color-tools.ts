import type {
  ChannelDescriptor,
  ChannelId,
  ChannelState,
  PixelSample,
} from '../types/editor';

type ColorModel = 'grayscale' | 'rgb';

interface ImageCharacteristics {
  model: ColorModel;
  hasAlpha: boolean;
}

const previewSize = 72;

const srgbToLinear = (value: number): number => {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const xyzPivot = (value: number): number =>
  value > 0.008856 ? Math.cbrt(value) : (7.787 * value) + (16 / 116);

export function createDefaultChannelState(): ChannelState {
  return {
    gray: true,
    red: true,
    green: true,
    blue: true,
    alpha: true,
  };
}

export function detectImageCharacteristics(imageData: ImageData): ImageCharacteristics {
  const { data } = imageData;
  let hasAlpha = false;
  let grayscale = true;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];

    if (alpha < 255) {
      hasAlpha = true;
    }

    if (grayscale && (red !== green || green !== blue)) {
      grayscale = false;
    }

    if (hasAlpha && !grayscale) {
      break;
    }
  }

  return {
    model: grayscale ? 'grayscale' : 'rgb',
    hasAlpha,
  };
}

export function getChannelDescriptors(imageData: ImageData): ChannelDescriptor[] {
  const characteristics = detectImageCharacteristics(imageData);
  const descriptors: ChannelDescriptor[] =
    characteristics.model === 'grayscale'
      ? [{ id: 'gray', label: 'Gray' }]
      : [
          { id: 'red', label: 'Red' },
          { id: 'green', label: 'Green' },
          { id: 'blue', label: 'Blue' },
        ];

  if (characteristics.hasAlpha) {
    descriptors.push({ id: 'alpha', label: 'Alpha' });
  }

  return descriptors;
}

export function normalizeChannelState(
  imageData: ImageData | null,
  currentState: ChannelState,
): ChannelState {
  if (!imageData) {
    return createDefaultChannelState();
  }

  const available = new Set(getChannelDescriptors(imageData).map((channel) => channel.id));

  return {
    gray: available.has('gray') ? currentState.gray : false,
    red: available.has('red') ? currentState.red : false,
    green: available.has('green') ? currentState.green : false,
    blue: available.has('blue') ? currentState.blue : false,
    alpha: available.has('alpha') ? currentState.alpha : false,
  };
}

export function composeVisibleImageData(
  source: ImageData,
  channelState: ChannelState,
): ImageData {
  const next = new Uint8ClampedArray(source.data);
  const descriptors = getChannelDescriptors(source);
  const hasAlphaChannel = descriptors.some((channel) => channel.id === 'alpha');
  const isGray = descriptors.some((channel) => channel.id === 'gray');
  const hasVisibleColor = isGray
    ? channelState.gray
    : channelState.red || channelState.green || channelState.blue;
  const showOnlyAlpha = hasAlphaChannel && channelState.alpha && !hasVisibleColor;

  for (let index = 0; index < next.length; index += 4) {
    const red = source.data[index];
    const green = source.data[index + 1];
    const blue = source.data[index + 2];
    const alpha = source.data[index + 3];

    if (showOnlyAlpha) {
      next[index] = alpha;
      next[index + 1] = alpha;
      next[index + 2] = alpha;
      next[index + 3] = 255;
      continue;
    }

    if (isGray) {
      const gray = channelState.gray ? red : 0;
      next[index] = gray;
      next[index + 1] = gray;
      next[index + 2] = gray;
    } else {
      next[index] = channelState.red ? red : 0;
      next[index + 1] = channelState.green ? green : 0;
      next[index + 2] = channelState.blue ? blue : 0;
    }

    next[index + 3] = hasAlphaChannel && channelState.alpha ? alpha : 255;
  }

  return new ImageData(next, source.width, source.height);
}

function drawChannelPreview(source: ImageData, channelId: ChannelId): string {
  const canvas = document.createElement('canvas');
  canvas.width = previewSize;
  canvas.height = previewSize;

  const context = canvas.getContext('2d');
  if (!context) {
    return '';
  }

  const previewData = new Uint8ClampedArray(source.data.length);

  for (let index = 0; index < source.data.length; index += 4) {
    const red = source.data[index];
    const green = source.data[index + 1];
    const blue = source.data[index + 2];
    const alpha = source.data[index + 3];
    const value =
      channelId === 'red'
        ? red
        : channelId === 'green'
          ? green
          : channelId === 'blue'
            ? blue
            : channelId === 'alpha'
              ? alpha
              : red;

    previewData[index] = value;
    previewData[index + 1] = value;
    previewData[index + 2] = value;
    previewData[index + 3] = 255;
  }

  const buffer = document.createElement('canvas');
  buffer.width = source.width;
  buffer.height = source.height;
  const bufferContext = buffer.getContext('2d');
  if (!bufferContext) {
    return '';
  }

  bufferContext.putImageData(new ImageData(previewData, source.width, source.height), 0, 0);
  context.imageSmoothingEnabled = false;
  context.drawImage(buffer, 0, 0, previewSize, previewSize);

  return canvas.toDataURL();
}

export function buildChannelPreviews(imageData: ImageData): Record<ChannelId, string> {
  const previews: Record<ChannelId, string> = {
    gray: '',
    red: '',
    green: '',
    blue: '',
    alpha: '',
  };

  for (const descriptor of getChannelDescriptors(imageData)) {
    previews[descriptor.id] = drawChannelPreview(imageData, descriptor.id);
  }

  return previews;
}

export function samplePixel(imageData: ImageData, x: number, y: number): PixelSample | null {
  if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
    return null;
  }

  const index = (y * imageData.width + x) * 4;
  const red = imageData.data[index];
  const green = imageData.data[index + 1];
  const blue = imageData.data[index + 2];

  const rLinear = srgbToLinear(red);
  const gLinear = srgbToLinear(green);
  const bLinear = srgbToLinear(blue);

  const xValue =
    ((0.4124564 * rLinear) + (0.3575761 * gLinear) + (0.1804375 * bLinear)) / 0.95047;
  const yValue = (0.2126729 * rLinear) + (0.7151522 * gLinear) + (0.072175 * bLinear);
  const zValue =
    ((0.0193339 * rLinear) + (0.119192 * gLinear) + (0.9503041 * bLinear)) / 1.08883;

  const fx = xyzPivot(xValue);
  const fy = xyzPivot(yValue);
  const fz = xyzPivot(zValue);

  return {
    x,
    y,
    rgb: { r: red, g: green, b: blue },
    lab: {
      l: Number((116 * fy - 16).toFixed(2)),
      a: Number((500 * (fx - fy)).toFixed(2)),
      b: Number((200 * (fy - fz)).toFixed(2)),
    },
  };
}
