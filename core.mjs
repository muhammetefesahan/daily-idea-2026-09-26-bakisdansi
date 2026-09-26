export function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

export function eyeCenters(width, height, points) {
  return points.map(([x, y]) => ({ x: x * width, y: y * height }));
}

function sample(data, width, height, x, y, channel) {
  const x0 = clamp(Math.floor(x), 0, width - 1), y0 = clamp(Math.floor(y), 0, height - 1);
  const x1 = clamp(x0 + 1, 0, width - 1), y1 = clamp(y0 + 1, 0, height - 1);
  const fx = clamp(x - x0, 0, 1), fy = clamp(y - y0, 0, 1);
  const at = (a, b) => data[(b * width + a) * 4 + channel];
  return (at(x0, y0) * (1 - fx) + at(x1, y0) * fx) * (1 - fy)
    + (at(x0, y1) * (1 - fx) + at(x1, y1) * fx) * fy;
}

// A small, feathered pixel shift. The edge of the ellipse stays still.
export function shiftEyes(source, width, height, points, radius, moveX, moveY) {
  if (source.length !== width * height * 4) throw new Error("Görüntü boyu yanlış.");
  const out = new Uint8ClampedArray(source);
  const rx = Math.max(2, radius * width), ry = Math.max(2, radius * height * .65);
  const dx = clamp(moveX, -.5, .5) * rx;
  const dy = clamp(moveY, -.5, .5) * ry;
  for (const { x: cx, y: cy } of eyeCenters(width, height, points)) {
    const left = Math.max(0, Math.floor(cx - rx)), right = Math.min(width - 1, Math.ceil(cx + rx));
    const top = Math.max(0, Math.floor(cy - ry)), bottom = Math.min(height - 1, Math.ceil(cy + ry));
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const distance = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (distance >= 1) continue;
      const feather = (1 - distance) ** 2;
      const sx = clamp(x - dx * feather, 0, width - 1);
      const sy = clamp(y - dy * feather, 0, height - 1);
      const i = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) out[i + c] = sample(source, width, height, sx, sy, c);
    }
  }
  return out;
}
