import { describe, expect, it } from "vitest";

import { diffImages } from "./visual-regression";

// Minimal PNG-shaped object accepted by diffImages (only uses .width/.height/.data)
function makePng(width: number, height: number, fill: number[] = [255, 255, 255, 255]) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3];
  }
  return { width, height, data } as unknown as import("pngjs").PNG;
}

describe("diffImages", () => {
  it("returns identical=true for two identical images", () => {
    const a = makePng(4, 4, [10, 20, 30, 255]);
    const b = makePng(4, 4, [10, 20, 30, 255]);
    const result = diffImages(a, b);
    expect(result.identical).toBe(true);
    expect(result.diffRatio).toBe(0);
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
  });

  it("reports size mismatch with diffRatio=1 and empty sample", () => {
    const a = makePng(4, 4);
    const b = makePng(5, 4);
    const result = diffImages(a, b);
    expect(result.identical).toBe(false);
    expect(result.diffRatio).toBe(1);
    expect(result.expectedWidth).toBe(4);
    expect(result.width).toBe(5);
    expect(result.sample).toEqual([]);
  });

  it("ignores small per-channel deltas within the threshold (6)", () => {
    const a = makePng(4, 4, [10, 10, 10, 255]);
    const b = makePng(4, 4, [13, 10, 12, 255]); // sum of abs diffs = 5 <= 6
    const result = diffImages(a, b);
    expect(result.identical).toBe(true);
    expect(result.diffRatio).toBe(0);
  });

  it("counts pixels that exceed the channel threshold", () => {
    const a = makePng(2, 2, [0, 0, 0, 255]);
    const b = makePng(2, 2, [0, 0, 0, 255]);
    // Flip one pixel to white: per-channel delta 255+255+255 = 765 > 6
    b.data[0] = 255;
    b.data[1] = 255;
    b.data[2] = 255;
    const result = diffImages(a, b);
    expect(result.diffRatio).toBe(1 / 4);
    expect(result.identical).toBe(false);
    expect(result.sample).toHaveLength(1);
    expect(result.sample[0]).toMatchObject({ x: 0, y: 0 });
  });

  it("caps the diff sample to at most 5 entries", () => {
    const a = makePng(10, 10, [0, 0, 0, 255]);
    const b = makePng(10, 10, [0, 0, 0, 255]);
    // Make every pixel different
    for (let i = 0; i < b.data.length; i += 4) {
      b.data[i] = 255;
      b.data[i + 1] = 255;
      b.data[i + 2] = 255;
    }
    const result = diffImages(a, b);
    expect(result.diffRatio).toBe(1);
    expect(result.sample.length).toBeLessThanOrEqual(5);
  });

  it("treats a 0x0 image as identical (no pixels to compare)", () => {
    const a = makePng(0, 0);
    const b = makePng(0, 0);
    const result = diffImages(a, b);
    expect(result.identical).toBe(true);
    expect(result.diffRatio).toBe(0);
  });
});
