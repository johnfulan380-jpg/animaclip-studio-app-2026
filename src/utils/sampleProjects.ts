import { AnimationProject, Frame, Layer, Camera3DConfig } from '../types/animation';

const defaultCamera3D: Camera3DConfig = {
  enabled: false,
  viewMode: 'camera',
  x: 0,
  y: 0,
  zoom: 1.0,
  rotation: 0,
  pitch: 0,
  yaw: 0,
  perspective: 1000,
  enableParallax: true,
  enableDoF: false,
  focalZ: 0,
  keyframes: [],
};

/**
 * Renders the classic 12-frame Bouncing Ball animation with Squash & Stretch
 */
export function createBouncingBallProject(): AnimationProject {
  const width = 1280;
  const height = 720;

  const layerShadow: Layer = {
    id: 'layer-shadow',
    name: 'Sombra Dinâmica',
    visible: true,
    locked: false,
    opacity: 0.6,
    blendMode: 'source-over',
    depthZ: -100,
    parallaxFactor: 0.8,
  };

  const layerBall: Layer = {
    id: 'layer-ball',
    name: 'Bola (Squash & Stretch)',
    visible: true,
    locked: false,
    opacity: 1.0,
    blendMode: 'source-over',
    depthZ: 0,
    parallaxFactor: 1.0,
  };

  const layerGuide: Layer = {
    id: 'layer-guide',
    name: 'Linha Guia & Chão',
    visible: true,
    locked: false,
    opacity: 0.45,
    blendMode: 'source-over',
    depthZ: -200,
    parallaxFactor: 0.6,
  };

  // Pre-render static guide layer (ground line + trajectory arc)
  const guideCanvas = document.createElement('canvas');
  guideCanvas.width = width;
  guideCanvas.height = height;
  const gCtx = guideCanvas.getContext('2d')!;
  
  // Ground line
  gCtx.strokeStyle = '#64748b';
  gCtx.lineWidth = 4;
  gCtx.setLineDash([8, 8]);
  gCtx.beginPath();
  gCtx.moveTo(100, 560);
  gCtx.lineTo(1180, 560);
  gCtx.stroke();
  gCtx.setLineDash([]);

  // Trajectory arc
  gCtx.strokeStyle = '#38bdf8';
  gCtx.lineWidth = 2;
  gCtx.setLineDash([6, 6]);
  gCtx.beginPath();
  gCtx.moveTo(640, 180);
  gCtx.quadraticCurveTo(640, 560, 640, 560);
  gCtx.stroke();
  gCtx.setLineDash([]);
  const guideDataUrl = guideCanvas.toDataURL('image/png');

  interface BallFrameSpec {
    y: number;
    rx: number;
    ry: number;
    shadowW: number;
    shadowAlpha: number;
  }

  const ballSpecs: BallFrameSpec[] = [
    { y: 200, rx: 55, ry: 55, shadowW: 40, shadowAlpha: 0.2 },
    { y: 260, rx: 53, ry: 57, shadowW: 48, shadowAlpha: 0.3 },
    { y: 350, rx: 48, ry: 68, shadowW: 65, shadowAlpha: 0.45 },
    { y: 470, rx: 40, ry: 82, shadowW: 90, shadowAlpha: 0.7 },
    { y: 550, rx: 85, ry: 28, shadowW: 130, shadowAlpha: 0.95 },
    { y: 460, rx: 42, ry: 80, shadowW: 88, shadowAlpha: 0.7 },
    { y: 340, rx: 48, ry: 66, shadowW: 62, shadowAlpha: 0.45 },
    { y: 250, rx: 53, ry: 58, shadowW: 46, shadowAlpha: 0.3 },
    { y: 210, rx: 55, ry: 55, shadowW: 42, shadowAlpha: 0.22 },
    { y: 195, rx: 56, ry: 54, shadowW: 38, shadowAlpha: 0.18 },
    { y: 200, rx: 55, ry: 55, shadowW: 40, shadowAlpha: 0.2 },
    { y: 215, rx: 54, ry: 56, shadowW: 42, shadowAlpha: 0.22 },
  ];

  const frames: Frame[] = ballSpecs.map((spec, idx) => {
    // 1. Draw Ball
    const bCanvas = document.createElement('canvas');
    bCanvas.width = width;
    bCanvas.height = height;
    const bCtx = bCanvas.getContext('2d')!;

    const cx = 640;
    const cy = spec.y;

    const ballGrad = bCtx.createRadialGradient(cx - spec.rx * 0.3, cy - spec.ry * 0.3, 5, cx, cy, spec.rx);
    ballGrad.addColorStop(0, '#f87171');
    ballGrad.addColorStop(0.5, '#ef4444');
    ballGrad.addColorStop(1, '#991b1b');

    bCtx.fillStyle = ballGrad;
    bCtx.beginPath();
    bCtx.ellipse(cx, cy, spec.rx, spec.ry, 0, 0, Math.PI * 2);
    bCtx.fill();

    bCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    bCtx.beginPath();
    bCtx.ellipse(cx - spec.rx * 0.35, cy - spec.ry * 0.35, spec.rx * 0.22, spec.ry * 0.16, -0.3, 0, Math.PI * 2);
    bCtx.fill();

    // 2. Draw Shadow
    const sCanvas = document.createElement('canvas');
    sCanvas.width = width;
    sCanvas.height = height;
    const sCtx = sCanvas.getContext('2d')!;

    sCtx.fillStyle = `rgba(15, 23, 42, ${spec.shadowAlpha})`;
    sCtx.beginPath();
    sCtx.ellipse(cx, 560, spec.shadowW, Math.max(6, spec.shadowW * 0.18), 0, 0, Math.PI * 2);
    sCtx.fill();

    return {
      id: `frame-${idx + 1}`,
      name: `Quadro ${idx + 1}`,
      holdFrames: 1,
      layers: {
        'layer-guide': guideDataUrl,
        'layer-ball': bCanvas.toDataURL('image/png'),
        'layer-shadow': sCanvas.toDataURL('image/png'),
      },
    };
  });

  return {
    id: 'proj-bouncing-ball',
    title: 'Bola Saltitante (Squash & Stretch)',
    fps: 12,
    width,
    height,
    backgroundColor: '#ffffff',
    isTransparent: false,
    layers: [layerShadow, layerBall, layerGuide],
    frames,
    currentFrameIndex: 0,
    activeLayerId: 'layer-ball',
    camera3D: { ...defaultCamera3D },
    bones: [],
    boneMode: 'pose',
    audioItems: [
      { id: 'sfx-bounce', name: 'Impacto Borracha', soundType: 'bounce', frame: 4 },
      { id: 'sfx-whoosh', name: 'Swoosh Subida', soundType: 'whoosh', frame: 6 },
    ],
  };
}

/**
 * Creates a blank new project with default unlimited layers
 */
export function createBlankProject(
  title: string = 'Minha Nova Animação',
  width: number = 1920,
  height: number = 1080,
  fps: number = 12
): AnimationProject {
  const layer1: Layer = {
    id: 'layer-1',
    name: 'Linha / Arte Principal',
    visible: true,
    locked: false,
    opacity: 1.0,
    blendMode: 'source-over',
    depthZ: 0,
    parallaxFactor: 1.0,
  };

  const layerBg: Layer = {
    id: 'layer-bg',
    name: 'Rascunho / Cores',
    visible: true,
    locked: false,
    opacity: 1.0,
    blendMode: 'source-over',
    depthZ: -200,
    parallaxFactor: 0.7,
  };

  const initialFrame: Frame = {
    id: 'frame-1',
    name: 'Quadro 1',
    holdFrames: 1,
    layers: {},
  };

  return {
    id: `proj-${Date.now()}`,
    title,
    fps,
    width,
    height,
    backgroundColor: '#ffffff',
    isTransparent: false,
    layers: [layerBg, layer1],
    frames: [initialFrame],
    currentFrameIndex: 0,
    activeLayerId: 'layer-1',
    camera3D: { ...defaultCamera3D },
    bones: [],
    boneMode: 'pose',
  };
}
