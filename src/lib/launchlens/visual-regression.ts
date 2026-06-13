import type { PNG as PNGType } from "pngjs";

export type ImageDiff = {
  identical: boolean;
  width: number;
  height: number;
  expectedWidth: number;
  expectedHeight: number;
  diffRatio: number;
  sample: Array<{ x: number; y: number; delta: number }>;
};

const CHANNEL_DELTA_THRESHOLD = 6;

export function diffImages(
  expected: PNGType,
  actual: PNGType,
  tolerance: number = 0.01,
  channelThreshold: number = CHANNEL_DELTA_THRESHOLD,
): ImageDiff {
  if (
    expected.width !== actual.width ||
    expected.height !== actual.height
  ) {
    return {
      identical: false,
      width: actual.width,
      height: actual.height,
      expectedWidth: expected.width,
      expectedHeight: expected.height,
      diffRatio: 1,
      sample: [],
    };
  }

  const width = expected.width;
  const height = expected.height;
  let diffPixels = 0;
  const sample: Array<{ x: number; y: number; delta: number }> = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (width * y + x) * 4;
      const delta =
        Math.abs(expected.data[offset] - actual.data[offset]) +
        Math.abs(expected.data[offset + 1] - actual.data[offset + 1]) +
        Math.abs(expected.data[offset + 2] - actual.data[offset + 2]);

      if (delta > channelThreshold) {
        diffPixels += 1;
        if (sample.length < 5) {
          sample.push({ x, y, delta });
        }
      }
    }
  }
  const totalPixels = width * height;
  const diffRatio = totalPixels === 0 ? 0 : diffPixels / totalPixels;

  return {
    identical: diffRatio <= tolerance,
    width,
    height,
    expectedWidth: expected.width,
    expectedHeight: expected.height,
    diffRatio,
    sample,
  };
}
