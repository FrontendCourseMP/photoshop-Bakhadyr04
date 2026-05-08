export type LevelsChannel = 'master' | 'red' | 'green' | 'blue' | 'alpha';

export type HistogramMode = 'linear' | 'logarithmic';

export interface LevelsRange {
  black: number;
  gamma: number;
  white: number;
}

export type LevelsState = Record<LevelsChannel, LevelsRange>;

export const levelChannels: Array<{ id: LevelsChannel; label: string }> = [
  { id: 'master', label: 'Master' },
  { id: 'red', label: 'Red' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
  { id: 'alpha', label: 'Alpha' },
];

export const defaultLevelsRange: LevelsRange = {
  black: 0,
  gamma: 1,
  white: 255,
};

export function createDefaultLevelsState(): LevelsState {
  return {
    master: { ...defaultLevelsRange },
    red: { ...defaultLevelsRange },
    green: { ...defaultLevelsRange },
    blue: { ...defaultLevelsRange },
    alpha: { ...defaultLevelsRange },
  };
}

export function clampLevel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function clampGamma(value: number): number {
  return Math.min(9.9, Math.max(0.1, Number(value.toFixed(2))));
}

export function gammaToMarker(gamma: number, black: number, white: number): number {
  const range = Math.max(1, white - black);
  const normalized = 0.5 ** (1 / clampGamma(gamma));
  return black + (normalized * range);
}

export function markerToGamma(marker: number, black: number, white: number): number {
  const range = Math.max(1, white - black);
  const normalized = Math.min(0.99, Math.max(0.01, (marker - black) / range));
  return clampGamma(Math.log(0.5) / Math.log(normalized));
}

export function normalizeLevelsRange(range: LevelsRange): LevelsRange {
  const black = Math.min(253, clampLevel(range.black));
  const white = Math.max(black + 2, clampLevel(range.white));

  return {
    black,
    gamma: clampGamma(range.gamma),
    white,
  };
}

export function buildHistogram(
  imageData: ImageData,
  channel: LevelsChannel,
): Uint32Array {
  const histogram = new Uint32Array(256);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const value =
      channel === 'red'
        ? data[index]
        : channel === 'green'
          ? data[index + 1]
          : channel === 'blue'
            ? data[index + 2]
            : channel === 'alpha'
              ? data[index + 3]
              : Math.round(
                  (0.2126 * data[index]) +
                    (0.7152 * data[index + 1]) +
                    (0.0722 * data[index + 2]),
                );

    histogram[value] += 1;
  }

  return histogram;
}

export function drawHistogramPath(
  context: CanvasRenderingContext2D,
  histogram: Uint32Array,
  mode: HistogramMode,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);

  const transformed = Array.from(histogram, (value) =>
    mode === 'logarithmic' ? Math.log1p(value) : value,
  );
  const max = Math.max(1, ...transformed);
  const barWidth = width / histogram.length;

  context.fillStyle = '#111318';
  context.fillRect(0, 0, width, height);
  context.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  context.lineWidth = 1;

  for (let step = 1; step < 4; step += 1) {
    const y = Math.round((height / 4) * step) + 0.5;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.fillStyle = '#8fbfff';
  for (let index = 0; index < transformed.length; index += 1) {
    const barHeight = Math.max(1, (transformed[index] / max) * (height - 8));
    context.fillRect(
      index * barWidth,
      height - barHeight,
      Math.max(1, Math.ceil(barWidth)),
      barHeight,
    );
  }

  const gradient = context.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.28)');
  context.fillStyle = gradient;
  context.fillRect(0, height - 8, width, 8);
}

function buildLut(range: LevelsRange): Uint8ClampedArray {
  const normalizedRange = normalizeLevelsRange(range);
  const lut = new Uint8ClampedArray(256);
  const denominator = normalizedRange.white - normalizedRange.black;

  for (let value = 0; value < lut.length; value += 1) {
    const normalized = Math.min(
      1,
      Math.max(0, (value - normalizedRange.black) / denominator),
    );
    lut[value] = Math.round((normalized ** normalizedRange.gamma) * 255);
  }

  return lut;
}

export function applyLevels(imageData: ImageData, levels: LevelsState): ImageData {
  const masterLut = buildLut(levels.master);
  const redLut = buildLut(levels.red);
  const greenLut = buildLut(levels.green);
  const blueLut = buildLut(levels.blue);
  const alphaLut = buildLut(levels.alpha);
  const next = new Uint8ClampedArray(imageData.data.length);

  for (let index = 0; index < imageData.data.length; index += 4) {
    next[index] = redLut[masterLut[imageData.data[index]]];
    next[index + 1] = greenLut[masterLut[imageData.data[index + 1]]];
    next[index + 2] = blueLut[masterLut[imageData.data[index + 2]]];
    next[index + 3] = alphaLut[imageData.data[index + 3]];
  }

  return new ImageData(next, imageData.width, imageData.height);
}
