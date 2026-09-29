export type BrushPresetType = 
  | 'pen'           // Smooth vector-like animation pen
  | 'pencil'        // Grainy textured sketching graphite
  | 'marker'        // Translucent chisel highlighter
  | 'airbrush'      // Soft radial gradient spray
  | 'textured-ink'  // Bristle / calligraphy ink
  | 'eraser';       // Eraser

export type ToolType = 
  | 'brush' 
  | 'eraser' 
  | 'bucket' 
  | 'lasso' 
  | 'magic-wand' 
  | 'shape' 
  | 'text' 
  | 'eyedropper'
  | 'camera'        // 3D Camera tool
  | 'bone';         // Skeletal Rigging & Posing tool

export type ShapeType = 'line' | 'rectangle' | 'circle' | 'arrow';

export type LoopMode = 'loop' | 'once' | 'ping-pong';

export type TransitionType = 
  | 'none'
  | 'crossfade'
  | 'fade-black'
  | 'fade-white'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'wipe-horizontal'
  | 'wipe-circle';

export interface FrameTransition {
  type: TransitionType;
  durationFrames: number;
  easing: 'linear' | 'ease-in-out' | 'ease-in' | 'ease-out';
}

export interface Bone {
  id: string;
  name: string;
  parentId: string | null;
  startPoint: { x: number; y: number }; // Joint position
  endPoint: { x: number; y: number };   // Tip position
  angle: number;                        // Local angle in degrees
  length: number;
  color?: string;
  boundLayerId?: string;                // Layer tied to this bone
}

export interface SkeletonPose {
  bones: Record<string, { startPoint: { x: number; y: number }; endPoint: { x: number; y: number }; angle: number }>;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  depthZ: number;       // -600 to +400 for 3D camera
  parallaxFactor: number;
  boundBoneId?: string; // Bound to a skeletal bone
}

export interface Camera3DKeyframe {
  frameIndex: number;
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  pitch: number;
  yaw: number;
}

export interface Camera3DConfig {
  enabled: boolean;
  viewMode: 'camera' | 'stage';
  x: number;
  y: number;
  zoom: number;
  rotation: number;
  pitch: number;
  yaw: number;
  perspective: number;
  enableParallax: boolean;
  enableDoF: boolean;
  focalZ: number;
  keyframes: Camera3DKeyframe[];
}

export interface Frame {
  id: string;
  layers: Record<string, string>; // Maps layerId -> Base64 PNG dataURL
  thumbnail?: string;
  name?: string;
  holdFrames?: number;
  transition?: FrameTransition;
  cameraKeyframe?: Camera3DKeyframe;
  bonePose?: SkeletonPose; // Character skeletal pose for this frame
}

export interface OnionSkinConfig {
  enabled: boolean;
  prevFrames: number;
  nextFrames: number;
  prevColor: string;
  nextColor: string;
  opacity: number;
  coloredTint: boolean;
}

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
  isTransparent: boolean;
  zoom: number;
  panX: number;
  panY: number;
  flippedHorizontal: boolean;
  showGrid: boolean;
  gridType: 'grid' | 'ruleOfThirds' | 'dots';
}

export interface BrushDynamics {
  preset: BrushPresetType;
  size: number;
  opacity: number;
  color: string;
  stabilizer: number;
  pressureDynamic: boolean;
  taper: number;
  hardness: number;
  spacing: number;
  textureDensity: number;
}

export interface SmartFillSettings {
  tolerance: number;
  expandPixels: number;
  closeGaps: boolean;
  gapThreshold: number;
  sampleAllLayers: boolean;
}

export interface MagicWandSettings {
  tolerance: number;
  contiguous: boolean;
  feather: number;
  sampleAllLayers: boolean;
}

export interface SelectionState {
  isActive: boolean;
  type: 'lasso' | 'magic-wand' | 'rect';
  polygon?: { x: number; y: number }[];
  maskImageData?: ImageData;
  extractedCanvas: HTMLCanvasElement | null;
  originalLayerId: string;
  bounds: { x: number; y: number; width: number; height: number };
  currentPos: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  isDragging: boolean;
  isTransforming: boolean;
  transformHandle?: 'move' | 'tl' | 'tr' | 'bl' | 'br' | 'rotate';
}

export interface AudioTrackItem {
  id: string;
  name: string;
  soundType: 'bounce' | 'whoosh' | 'pop' | 'click' | 'step';
  frame: number;
}

export type ExportFormat = 'mp4' | 'webm' | 'gif' | 'zip' | 'png-current';

export interface ResolutionPreset {
  id: string;
  label: string;
  width: number;
  height: number;
  aspect: string;
  badge?: string;
}

export interface ExportSettings {
  format: ExportFormat;
  resolutionId: string;
  width: number;
  height: number;
  fps: number;
  includeBackground: boolean;
  backgroundColor: string;
  quality: number;
  loopCount: number;
  smoothSmoothing: boolean;
  renderTransitions: boolean;
  applyCamera3D: boolean;
}

export interface AnimationProject {
  id: string;
  title: string;
  fps: number;
  width: number;
  height: number;
  backgroundColor: string;
  isTransparent: boolean;
  layers: Layer[];
  frames: Frame[];
  currentFrameIndex: number;
  activeLayerId: string;
  camera3D: Camera3DConfig;
  bones?: Bone[];          // Skeletal bones in project
  activeBoneId?: string;   // Currently selected bone
  boneMode?: 'pose' | 'create'; // Pose existing character or create new bones
  audioItems?: AudioTrackItem[];
}
