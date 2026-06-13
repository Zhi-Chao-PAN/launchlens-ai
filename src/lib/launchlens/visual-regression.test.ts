import { describe, expect, it } from "vitest";

import { PNG } from "pngjs";

import { diffImages } from "./visual-regression";

function makePng(width: number, height: number, color: [number, number, number]) {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i += 1) {
    png.data[i * 4] = color[0];
    png.data[i * 4 + 1] = color[1];
    png.data[i * 4 + 2] = color[2];
    png.data[i * 4 + 3] = 255;
  }
  return png;
}

describe("diffImages", () => {
  it("returns zero diff for identical images", () => {
    const a = makePng(10, 10, [10, 20, 30]);
    const b = makePng(10, 10, [10, 20, 30]);
    const result = diffImages(a, b);

    expect(result.diffRatio).toBe(0);
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });

  it("counts only pixels with notable color delta", () => {
    const a = makePng(4, 1, [10, 10, 10]);
    const b = makePng(4, 1, [10, 10, 10]);
    b.data[0] = 200;
    b.data[1] = 200;
    b.data[2] = 200;
    const result = diffImages(a, b, 0.01);

    expect(result.diffRatio).toBeCloseTo(0.25, 4);
  });

  it("returns a full diff when dimensions differ", () => {
    const a = makePng(4, 4, [0, 0, 0]);
    const b = makePng(2, 2, [0, 0, 0]);
    const result = diffImages(a, b);

    expect(result.diffRatio).toBe(1);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
  });
});
