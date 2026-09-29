import { BrushDynamics, BrushPresetType } from '../types/animation';

export interface StrokePoint {
  x: number;
  y: number;
  time: number;
  pressure?: number;
  speed?: number;
  width?: number;
}

/**
 * Creates noise/texture patterns for pencil and textured brushes
 */
function createPencilPattern(size: number, color: string): HTMLCanvasElement {
  const patternCanvas = document.createElement('canvas');
  const s = Math.max(16, Math.min(64, Math.round(size * 2)));
  patternCanvas.width = s;
  patternCanvas.height = s;
  const pCtx = patternCanvas.getContext('2d');
  if (!pCtx) return patternCanvas;

  pCtx.fillStyle = color;
  const count = Math.floor(s * s * 0.35);
  for (let i = 0; i < count; i++) {
    const px = Math.random() * s;
    const py = Math.random() * s;
    const alpha = Math.random() * 0.6 + 0.2;
    pCtx.globalAlpha = alpha;
    pCtx.fillRect(px, py, 1.2, 1.2);
  }

  return patternCanvas;
}

/**
 * Applies smoothing stabilizer to points
 */
export function smoothPoints(points: StrokePoint[], stabilizerLevel: number): StrokePoint[] {
  if (points.length < 3 || stabilizerLevel <= 0) return points;

  const smoothed: StrokePoint[] = [points[0]];
  const weight = Math.min(0.85, 0.2 + (stabilizerLevel / 10) * 0.65);

  for (let i = 1; i < points.length; i++) {
    const prev = smoothed[i - 1];
    const curr = points[i];
    const smoothedX = prev.x * weight + curr.x * (1 - weight);
    const smoothedY = prev.y * weight + curr.y * (1 - weight);
    smoothed.push({
      x: smoothedX,
      y: smoothedY,
      time: curr.time,
      pressure: curr.pressure,
      speed: curr.speed,
    });
  }

  return smoothed;
}

/**
 * Calculates stroke point speed to simulate dynamic stylus pressure
 */
export function calculatePointSpeed(p1: StrokePoint, p2: StrokePoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const dt = Math.max(1, p2.time - p1.time);
  return dist / dt; // pixels per ms
}

/**
 * Main Brush Engine: renders a segment or full stroke onto target canvas context
 */
export function renderStrokeSegment(
  ctx: CanvasRenderingContext2D,
  p1: StrokePoint,
  p2: StrokePoint,
  p3: StrokePoint | null,
  brush: BrushDynamics,
  isEraser: boolean = false
) {
  ctx.save();

  if (isEraser || brush.preset === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  } else if (brush.preset === 'marker') {
    ctx.globalCompositeOperation = 'multiply';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }

  const baseOpacity = brush.opacity;
  const baseSize = brush.size;

  // Velocity-based dynamic width
  let dynamicWidth = baseSize;
  if (brush.pressureDynamic) {
    const speed = p2.speed || calculatePointSpeed(p1, p2);
    // Faster strokes get slightly thinner and tapered
    const factor = Math.max(0.35, Math.min(1.4, 1.1 - speed * 0.15));
    dynamicWidth = baseSize * factor;
  }

  switch (brush.preset) {
    case 'airbrush': {
      // Soft radial gradient spray stamp
      ctx.globalAlpha = baseOpacity * 0.45;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = Math.max(1, dynamicWidth * 0.2);
      const steps = Math.ceil(dist / step);

      for (let s = 0; s <= steps; s++) {
        const t = steps > 0 ? s / steps : 0;
        const cx = p1.x + dx * t;
        const cy = p1.y + dy * t;
        const radius = dynamicWidth / 2;

        const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        radGrad.addColorStop(0, brush.color);
        radGrad.addColorStop(0.5, brush.color);
        radGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'pencil': {
      // Grainy graphite texture
      ctx.globalAlpha = baseOpacity * 0.75;
      ctx.strokeStyle = brush.color;
      ctx.lineWidth = dynamicWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Subtle jitter to simulate paper grain
      const jitterAmount = Math.max(0.5, dynamicWidth * 0.08);
      const jx1 = p1.x + (Math.random() - 0.5) * jitterAmount;
      const jy1 = p1.y + (Math.random() - 0.5) * jitterAmount;
      const jx2 = p2.x + (Math.random() - 0.5) * jitterAmount;
      const jy2 = p2.y + (Math.random() - 0.5) * jitterAmount;

      ctx.beginPath();
      ctx.moveTo(jx1, jy1);
      ctx.lineTo(jx2, jy2);
      ctx.stroke();

      // Additional textured micro-particles along stroke
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const count = Math.floor(dist * 0.8 * (brush.textureDensity || 1));
      ctx.fillStyle = brush.color;
      for (let i = 0; i < count; i++) {
        const t = Math.random();
        const nx = p1.x + (p2.x - p1.x) * t + (Math.random() - 0.5) * dynamicWidth * 0.8;
        const ny = p1.y + (p2.y - p1.y) * t + (Math.random() - 0.5) * dynamicWidth * 0.8;
        ctx.globalAlpha = Math.random() * baseOpacity * 0.5;
        ctx.fillRect(nx, ny, 1, 1);
      }
      break;
    }

    case 'textured-ink': {
      // Bristle ink with split strokes
      ctx.globalAlpha = baseOpacity * 0.9;
      ctx.strokeStyle = brush.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const bristles = Math.max(2, Math.min(5, Math.floor(dynamicWidth / 4)));
      const perpX = -(p2.y - p1.y);
      const perpY = p2.x - p1.x;
      const len = Math.hypot(perpX, perpY) || 1;
      const normX = perpX / len;
      const normY = perpY / len;

      for (let b = 0; b < bristles; b++) {
        const offset = ((b / (bristles - 1 || 1)) - 0.5) * dynamicWidth * 0.8;
        ctx.lineWidth = Math.max(1, dynamicWidth / bristles);
        ctx.beginPath();
        ctx.moveTo(p1.x + normX * offset, p1.y + normY * offset);
        ctx.lineTo(p2.x + normX * offset, p2.y + normY * offset);
        ctx.stroke();
      }
      break;
    }

    case 'marker': {
      // Chisel marker stroke
      ctx.globalAlpha = baseOpacity * 0.45;
      ctx.strokeStyle = brush.color;
      ctx.lineWidth = dynamicWidth;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'bevel';

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      break;
    }

    case 'eraser': {
      // Clean eraser
      ctx.globalAlpha = baseOpacity;
      ctx.lineWidth = dynamicWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      break;
    }

    case 'pen':
    default: {
      // Smooth vector-like animation pen
      ctx.globalAlpha = baseOpacity;
      ctx.strokeStyle = brush.color;
      ctx.fillStyle = brush.color;
      ctx.lineWidth = dynamicWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (p3) {
        // Quadratic Bézier curve through midpoints for ultra smooth curves
        const midX = (p2.x + p3.x) / 2;
        const midY = (p2.y + p3.y) / 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(p2.x, p2.y, midX, midY);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}
