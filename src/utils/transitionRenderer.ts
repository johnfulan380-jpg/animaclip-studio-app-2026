import { FrameTransition, TransitionType } from '../types/animation';

/**
 * Calculates eased progression (0 to 1) based on easing type
 */
export function getEasingValue(t: number, easing: FrameTransition['easing'] = 'ease-in-out'): number {
  t = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'linear':
    default:
      return t;
  }
}

/**
 * Renders an in-between transition frame onto targetCtx combining canvasA and canvasB
 */
export function renderTransitionFrame(
  targetCtx: CanvasRenderingContext2D,
  canvasA: HTMLCanvasElement,
  canvasB: HTMLCanvasElement,
  type: TransitionType,
  progress: number, // 0 to 1
  easing: FrameTransition['easing'] = 'ease-in-out',
  bgColor: string = '#ffffff'
) {
  const width = targetCtx.canvas.width;
  const height = targetCtx.canvas.height;
  const t = getEasingValue(progress, easing);

  targetCtx.clearRect(0, 0, width, height);

  switch (type) {
    case 'crossfade': {
      // Frame A fading out
      targetCtx.save();
      targetCtx.globalAlpha = 1 - t;
      targetCtx.drawImage(canvasA, 0, 0, width, height);
      targetCtx.restore();

      // Frame B fading in
      targetCtx.save();
      targetCtx.globalAlpha = t;
      targetCtx.drawImage(canvasB, 0, 0, width, height);
      targetCtx.restore();
      break;
    }

    case 'fade-black': {
      if (t < 0.5) {
        // Fade A to black
        const alphaA = 1 - t * 2;
        targetCtx.fillStyle = '#000000';
        targetCtx.fillRect(0, 0, width, height);

        targetCtx.save();
        targetCtx.globalAlpha = alphaA;
        targetCtx.drawImage(canvasA, 0, 0, width, height);
        targetCtx.restore();
      } else {
        // Fade B in from black
        const alphaB = (t - 0.5) * 2;
        targetCtx.fillStyle = '#000000';
        targetCtx.fillRect(0, 0, width, height);

        targetCtx.save();
        targetCtx.globalAlpha = alphaB;
        targetCtx.drawImage(canvasB, 0, 0, width, height);
        targetCtx.restore();
      }
      break;
    }

    case 'fade-white': {
      if (t < 0.5) {
        const whiteAlpha = t * 2;
        targetCtx.drawImage(canvasA, 0, 0, width, height);
        targetCtx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
        targetCtx.fillRect(0, 0, width, height);
      } else {
        const whiteAlpha = 1 - (t - 0.5) * 2;
        targetCtx.drawImage(canvasB, 0, 0, width, height);
        targetCtx.fillStyle = `rgba(255, 255, 255, ${whiteAlpha})`;
        targetCtx.fillRect(0, 0, width, height);
      }
      break;
    }

    case 'slide-left': {
      // Slide left: A slides out to left, B slides in from right
      const offsetX = t * width;
      targetCtx.drawImage(canvasA, -offsetX, 0, width, height);
      targetCtx.drawImage(canvasB, width - offsetX, 0, width, height);
      break;
    }

    case 'slide-right': {
      // Slide right: A slides out to right, B slides in from left
      const offsetX = t * width;
      targetCtx.drawImage(canvasA, offsetX, 0, width, height);
      targetCtx.drawImage(canvasB, -width + offsetX, 0, width, height);
      break;
    }

    case 'slide-up': {
      // Slide up: A slides out top, B slides in bottom
      const offsetY = t * height;
      targetCtx.drawImage(canvasA, 0, -offsetY, width, height);
      targetCtx.drawImage(canvasB, 0, height - offsetY, width, height);
      break;
    }

    case 'slide-down': {
      // Slide down: A slides out bottom, B slides in top
      const offsetY = t * height;
      targetCtx.drawImage(canvasA, 0, offsetY, width, height);
      targetCtx.drawImage(canvasB, 0, -height + offsetY, width, height);
      break;
    }

    case 'zoom-in': {
      // A scales up and fades out, B scales from small to normal
      targetCtx.save();
      targetCtx.globalAlpha = 1 - t;
      const scaleA = 1 + t * 0.4;
      const cx = width / 2;
      const cy = height / 2;
      targetCtx.translate(cx, cy);
      targetCtx.scale(scaleA, scaleA);
      targetCtx.drawImage(canvasA, -cx, -cy, width, height);
      targetCtx.restore();

      targetCtx.save();
      targetCtx.globalAlpha = t;
      const scaleB = 0.7 + t * 0.3;
      targetCtx.translate(cx, cy);
      targetCtx.scale(scaleB, scaleB);
      targetCtx.drawImage(canvasB, -cx, -cy, width, height);
      targetCtx.restore();
      break;
    }

    case 'zoom-out': {
      // A shrinks away, B expands from oversized to normal
      targetCtx.save();
      targetCtx.globalAlpha = 1 - t;
      const scaleA = 1 - t * 0.3;
      const cx = width / 2;
      const cy = height / 2;
      targetCtx.translate(cx, cy);
      targetCtx.scale(scaleA, scaleA);
      targetCtx.drawImage(canvasA, -cx, -cy, width, height);
      targetCtx.restore();

      targetCtx.save();
      targetCtx.globalAlpha = t;
      const scaleB = 1.3 - t * 0.3;
      targetCtx.translate(cx, cy);
      targetCtx.scale(scaleB, scaleB);
      targetCtx.drawImage(canvasB, -cx, -cy, width, height);
      targetCtx.restore();
      break;
    }

    case 'wipe-horizontal': {
      // Draw A full
      targetCtx.drawImage(canvasA, 0, 0, width, height);

      // Clip B to sweeping rectangle
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.rect(0, 0, width * t, height);
      targetCtx.clip();
      targetCtx.drawImage(canvasB, 0, 0, width, height);
      targetCtx.restore();
      break;
    }

    case 'wipe-circle': {
      // Iconic Cartoon Iris Wipe!
      targetCtx.drawImage(canvasA, 0, 0, width, height);

      // Expanding circular mask
      const maxRadius = Math.hypot(width / 2, height / 2);
      const currentRadius = t * maxRadius;

      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.arc(width / 2, height / 2, currentRadius, 0, Math.PI * 2);
      targetCtx.clip();
      targetCtx.drawImage(canvasB, 0, 0, width, height);
      targetCtx.restore();
      break;
    }

    case 'none':
    default: {
      targetCtx.drawImage(t < 0.5 ? canvasA : canvasB, 0, 0, width, height);
      break;
    }
  }
}
