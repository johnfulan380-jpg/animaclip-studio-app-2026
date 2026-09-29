import { SelectionState, MagicWandSettings } from '../types/animation';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Checks if a point is inside a polygon using ray casting
 */
export function isPointInPolygon(pt: { x: number; y: number }, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;

    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi || 0.00001) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Computes bounding box of polygon points
 */
export function getPolygonBounds(poly: { x: number; y: number }[]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const padding = 2;
  return {
    x: Math.max(0, Math.floor(minX - padding)),
    y: Math.max(0, Math.floor(minY - padding)),
    width: Math.max(1, Math.ceil(maxX - minX + padding * 2)),
    height: Math.max(1, Math.ceil(maxY - minY + padding * 2)),
  };
}

/**
 * Extracts freehand lasso selection from canvas into a detached canvas
 * and clears the region from the original layer canvas
 */
export function extractLassoSelection(
  sourceCtx: CanvasRenderingContext2D,
  polygon: { x: number; y: number }[],
  originalLayerId: string
): SelectionState | null {
  if (polygon.length < 3) return null;

  const bounds = getPolygonBounds(polygon);
  if (bounds.width <= 1 || bounds.height <= 1) return null;

  const extractedCanvas = document.createElement('canvas');
  extractedCanvas.width = bounds.width;
  extractedCanvas.height = bounds.height;
  const extCtx = extractedCanvas.getContext('2d');
  if (!extCtx) return null;

  // Clip to polygon path relative to bounds
  extCtx.save();
  extCtx.beginPath();
  polygon.forEach((pt, idx) => {
    const rx = pt.x - bounds.x;
    const ry = pt.y - bounds.y;
    if (idx === 0) extCtx.moveTo(rx, ry);
    else extCtx.lineTo(rx, ry);
  });
  extCtx.closePath();
  extCtx.clip();

  // Draw source image into extracted canvas
  extCtx.drawImage(
    sourceCtx.canvas,
    bounds.x, bounds.y, bounds.width, bounds.height,
    0, 0, bounds.width, bounds.height
  );
  extCtx.restore();

  // Clear original layer selection area
  sourceCtx.save();
  sourceCtx.globalCompositeOperation = 'destination-out';
  sourceCtx.beginPath();
  polygon.forEach((pt, idx) => {
    if (idx === 0) sourceCtx.moveTo(pt.x, pt.y);
    else sourceCtx.lineTo(pt.x, pt.y);
  });
  sourceCtx.closePath();
  sourceCtx.fill();
  sourceCtx.restore();

  return {
    isActive: true,
    type: 'lasso',
    polygon,
    extractedCanvas,
    originalLayerId,
    bounds,
    currentPos: { x: bounds.x, y: bounds.y },
    scale: { x: 1, y: 1 },
    rotation: 0,
    isDragging: false,
    isTransforming: false,
  };
}

/**
 * Magic Wand selection extraction
 */
export function extractMagicWandSelection(
  sourceCtx: CanvasRenderingContext2D,
  sampleCtx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  settings: MagicWandSettings,
  originalLayerId: string
): SelectionState | null {
  const width = sourceCtx.canvas.width;
  const height = sourceCtx.canvas.height;

  startX = Math.floor(startX);
  startY = Math.floor(startY);
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return null;

  const sampleData = sampleCtx.getImageData(0, 0, width, height).data;
  const startIndex = (startY * width + startX) * 4;
  const sR = sampleData[startIndex];
  const sG = sampleData[startIndex + 1];
  const sB = sampleData[startIndex + 2];
  const sA = sampleData[startIndex + 3];

  const tolerance = (settings.tolerance / 100) * 255;
  const mask = new Uint8Array(width * height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  function matchColor(idx: number): boolean {
    const r = sampleData[idx];
    const g = sampleData[idx + 1];
    const b = sampleData[idx + 2];
    const a = sampleData[idx + 3];

    const dist = Math.sqrt(
      (r - sR) * (r - sR) +
      (g - sG) * (g - sG) +
      (b - sB) * (b - sB) +
      (a - sA) * (a - sA)
    );
    return dist <= tolerance;
  }

  if (settings.contiguous) {
    // BFS Flood fill
    const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];
    while (stack.length > 0) {
      const pt = stack.pop()!;
      const pos = pt.y * width + pt.x;
      if (mask[pos]) continue;

      mask[pos] = 1;
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;

      const neighbors = [
        { x: pt.x + 1, y: pt.y },
        { x: pt.x - 1, y: pt.y },
        { x: pt.x, y: pt.y + 1 },
        { x: pt.x, y: pt.y - 1 },
      ];

      for (const n of neighbors) {
        if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
          const nPos = n.y * width + n.x;
          if (!mask[nPos] && matchColor(nPos * 4)) {
            stack.push(n);
          }
        }
      }
    }
  } else {
    // Global match across entire frame
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = y * width + x;
        if (matchColor(pos * 4)) {
          mask[pos] = 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  if (minX > maxX || minY > maxY) return null;

  const bounds: BoundingBox = {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX + 1),
    height: Math.max(1, maxY - minY + 1),
  };

  // Extract pixels from source layer
  const sourceImgData = sourceCtx.getImageData(0, 0, width, height);
  const sourceData = sourceImgData.data;

  const extractedCanvas = document.createElement('canvas');
  extractedCanvas.width = bounds.width;
  extractedCanvas.height = bounds.height;
  const extCtx = extractedCanvas.getContext('2d');
  if (!extCtx) return null;

  const extImgData = extCtx.createImageData(bounds.width, bounds.height);
  const extData = extImgData.data;

  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      const globalPos = y * width + x;
      if (mask[globalPos]) {
        const gIdx = globalPos * 4;
        const lX = x - bounds.x;
        const lY = y - bounds.y;
        const lIdx = (lY * bounds.width + lX) * 4;

        extData[lIdx] = sourceData[gIdx];
        extData[lIdx + 1] = sourceData[gIdx + 1];
        extData[lIdx + 2] = sourceData[gIdx + 2];
        extData[lIdx + 3] = sourceData[gIdx + 3];

        // Clear original
        sourceData[gIdx + 3] = 0;
      }
    }
  }

  extCtx.putImageData(extImgData, 0, 0);
  sourceCtx.putImageData(sourceImgData, 0, 0);

  return {
    isActive: true,
    type: 'magic-wand',
    extractedCanvas,
    originalLayerId,
    bounds,
    currentPos: { x: bounds.x, y: bounds.y },
    scale: { x: 1, y: 1 },
    rotation: 0,
    isDragging: false,
    isTransforming: false,
  };
}

/**
 * Commits transformed selection back onto target canvas
 */
export function stampSelection(
  targetCtx: CanvasRenderingContext2D,
  selection: SelectionState
) {
  if (!selection.extractedCanvas) return;

  targetCtx.save();
  const centerX = selection.currentPos.x + (selection.bounds.width * selection.scale.x) / 2;
  const centerY = selection.currentPos.y + (selection.bounds.height * selection.scale.y) / 2;

  targetCtx.translate(centerX, centerY);
  targetCtx.rotate((selection.rotation * Math.PI) / 180);
  targetCtx.scale(selection.scale.x, selection.scale.y);

  targetCtx.drawImage(
    selection.extractedCanvas,
    -selection.bounds.width / 2,
    -selection.bounds.height / 2
  );

  targetCtx.restore();
}
