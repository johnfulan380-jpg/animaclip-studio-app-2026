import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  AnimationProject, 
  ToolType, 
  BrushDynamics, 
  SmartFillSettings, 
  MagicWandSettings, 
  ShapeType, 
  OnionSkinConfig, 
  CanvasSettings, 
  SelectionState, 
  LoopMode, 
  Frame, 
  Layer,
  Bone,
  FrameTransition
} from './types/animation';
import { createBouncingBallProject } from './utils/sampleProjects';
import { soundEffects } from './utils/audioSynthesizer';
import { TopBar } from './components/TopBar';
import { Toolbar } from './components/Toolbar';
import { ToolPropertiesPanel } from './components/ToolPropertiesPanel';
import { CanvasArea } from './components/CanvasArea';
import { Timeline } from './components/Timeline';
import { LayersPanel } from './components/LayersPanel';
import { Camera3DControls } from './components/Camera3DControls';
import { BoneToolPanel } from './components/BoneToolPanel';
import { TransitionModal } from './components/TransitionModal';
import { ExportModal } from './components/ExportModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { InstallAppModal } from './components/InstallAppModal';

export default function App() {
  // Initialize default project
  const [project, setProject] = useState<AnimationProject>(() => {
    const p = createBouncingBallProject();
    p.camera3D = {
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
    p.bones = [];
    p.boneMode = 'pose';
    return p;
  });

  // Active Tool & Brush Dynamics
  const [activeTool, setActiveTool] = useState<ToolType>('brush');
  const [brush, setBrush] = useState<BrushDynamics>({
    preset: 'pen',
    size: 6,
    opacity: 1.0,
    color: '#000000',
    stabilizer: 4,
    pressureDynamic: true,
    taper: 0.5,
    hardness: 0.9,
    spacing: 0.1,
    textureDensity: 1.0,
  });

  // Smart Fill Settings
  const [smartFill, setSmartFill] = useState<SmartFillSettings>({
    tolerance: 35,
    expandPixels: 2,
    closeGaps: true,
    gapThreshold: 3,
    sampleAllLayers: true,
  });

  // Magic Wand Settings
  const [magicWand, setMagicWand] = useState<MagicWandSettings>({
    tolerance: 32,
    contiguous: true,
    feather: 0,
    sampleAllLayers: false,
  });

  // Active Shape & Selection
  const [activeShape, setActiveShape] = useState<ShapeType>('circle');
  const [selection, setSelection] = useState<SelectionState | null>(null);

  // Onion Skinning
  const [onionSkin, setOnionSkin] = useState<OnionSkinConfig>({
    enabled: true,
    prevFrames: 1,
    nextFrames: 1,
    prevColor: '#ef4444',
    nextColor: '#22c55e',
    opacity: 0.35,
    coloredTint: true,
  });

  // Canvas Viewport Controls
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>({
    width: project.width,
    height: project.height,
    backgroundColor: project.backgroundColor,
    isTransparent: project.isTransparent,
    zoom: 0.85,
    panX: 0,
    panY: 0,
    flippedHorizontal: false,
    showGrid: false,
    gridType: 'grid',
  });

  // Playback & Sound
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>('loop');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const pingPongForwardRef = useRef(true);

  // Clipboard for frames
  const [copiedFrame, setCopiedFrame] = useState<Frame | null>(null);

  // Undo / Redo History Stacks
  const [undoStack, setUndoStack] = useState<AnimationProject[]>([]);
  const [redoStack, setRedoStack] = useState<AnimationProject[]>([]);

  // Panels & Modals
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [showCamera3DPanel, setShowCamera3DPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [transitionModalFrameIndex, setTransitionModalFrameIndex] = useState<number | null>(null);

  /**
   * Records project state snapshot for Undo/Redo
   */
  const recordHistory = useCallback((_desc: string) => {
    setUndoStack((prev) => [...prev.slice(-25), JSON.parse(JSON.stringify(project))]);
    setRedoStack([]);
  }, [project]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(project))]);
    setUndoStack((prev) => prev.slice(0, -1));
    setProject(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, JSON.parse(JSON.stringify(project))]);
    setRedoStack((prev) => prev.slice(0, -1));
    setProject(next);
  };

  /**
   * Save canvas drawing to active layer on current frame
   */
  const handleSaveActiveLayerCanvas = (dataUrl: string) => {
    setProject((prev) => {
      const curFrame = prev.frames[prev.currentFrameIndex];
      if (!curFrame) return prev;

      const updatedLayers = {
        ...curFrame.layers,
        [prev.activeLayerId]: dataUrl,
      };

      const updatedFrames = [...prev.frames];
      updatedFrames[prev.currentFrameIndex] = {
        ...curFrame,
        layers: updatedLayers,
        thumbnail: dataUrl, // update thumbnail
      };

      return {
        ...prev,
        frames: updatedFrames,
      };
    });
  };

  /**
   * Playback animation loop
   */
  useEffect(() => {
    if (!isPlaying) return;

    let timeoutId: number;
    let holdCount = 0;

    const tick = () => {
      setProject((prev) => {
        const curFrame = prev.frames[prev.currentFrameIndex];
        const requiredHold = curFrame?.holdFrames || 1;

        holdCount++;
        if (holdCount < requiredHold) {
          return prev;
        }
        holdCount = 0;

        let nextIdx = prev.currentFrameIndex;
        const total = prev.frames.length;

        if (loopMode === 'loop') {
          nextIdx = (prev.currentFrameIndex + 1) % total;
        } else if (loopMode === 'once') {
          if (prev.currentFrameIndex < total - 1) {
            nextIdx = prev.currentFrameIndex + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        } else if (loopMode === 'ping-pong') {
          if (pingPongForwardRef.current) {
            if (prev.currentFrameIndex < total - 1) {
              nextIdx = prev.currentFrameIndex + 1;
            } else {
              pingPongForwardRef.current = false;
              nextIdx = Math.max(0, prev.currentFrameIndex - 1);
            }
          } else {
            if (prev.currentFrameIndex > 0) {
              nextIdx = prev.currentFrameIndex - 1;
            } else {
              pingPongForwardRef.current = true;
              nextIdx = Math.min(total - 1, prev.currentFrameIndex + 1);
            }
          }
        }

        // Trigger sound effects for frame
        if (soundEnabled && prev.audioItems) {
          const sound = prev.audioItems.find((s) => s.frame === nextIdx);
          if (sound) {
            soundEffects.play(sound.soundType, 0.7);
          }
        }

        return {
          ...prev,
          currentFrameIndex: nextIdx,
        };
      });

      timeoutId = window.setTimeout(tick, 1000 / project.fps);
    };

    timeoutId = window.setTimeout(tick, 1000 / project.fps);
    return () => clearTimeout(timeoutId);
  }, [isPlaying, project.fps, loopMode, soundEnabled]);

  /**
   * Keyboard Shortcuts Handler
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // Space: Toggle Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Frame Navigation
      if (e.key === ',' || e.key === '<') {
        setProject((p) => ({ ...p, currentFrameIndex: Math.max(0, p.currentFrameIndex - 1) }));
      } else if (e.key === '.' || e.key === '>') {
        setProject((p) => ({ ...p, currentFrameIndex: Math.min(p.frames.length - 1, p.currentFrameIndex + 1) }));
      }

      // Tools
      switch (e.key.toLowerCase()) {
        case 'b':
          setActiveTool('brush');
          break;
        case 'e':
          setActiveTool('eraser');
          break;
        case 'g':
          setActiveTool('bucket');
          break;
        case 'l':
          setActiveTool('lasso');
          break;
        case 'w':
          setActiveTool('magic-wand');
          break;
        case 'u':
          setActiveTool('shape');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'i':
          setActiveTool('eyedropper');
          break;
        case 'c':
          setShowCamera3DPanel((prev) => !prev);
          break;
        case 'o':
          setOnionSkin((prev) => ({ ...prev, enabled: !prev.enabled }));
          break;
        case '[':
          setBrush((b) => ({ ...b, size: Math.max(1, b.size - 4) }));
          break;
        case ']':
          setBrush((b) => ({ ...b, size: Math.min(120, b.size + 4) }));
          break;
        case 'n':
          handleAddFrame(true);
          break;
        case 'd':
          handleDuplicateFrame(project.currentFrameIndex);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project.currentFrameIndex, project.frames.length]);

  /**
   * Timeline Frame Operations
   */
  const handleAddFrame = (insertAfterCurrent: boolean = false) => {
    recordHistory('Adicionar Quadro');
    const newFrameId = `frame-${Date.now()}`;
    const newFrame: Frame = {
      id: newFrameId,
      name: `Quadro ${project.frames.length + 1}`,
      holdFrames: 1,
      layers: {},
    };

    setProject((prev) => {
      const frames = [...prev.frames];
      const insertIdx = insertAfterCurrent ? prev.currentFrameIndex + 1 : frames.length;
      frames.splice(insertIdx, 0, newFrame);
      return {
        ...prev,
        frames,
        currentFrameIndex: insertIdx,
      };
    });
  };

  const handleDuplicateFrame = (index: number) => {
    recordHistory('Duplicar Quadro');
    const target = project.frames[index];
    if (!target) return;

    const duplicated: Frame = {
      id: `frame-${Date.now()}`,
      name: `${target.name || 'Quadro'} (Cópia)`,
      holdFrames: target.holdFrames || 1,
      layers: { ...target.layers },
      thumbnail: target.thumbnail,
      transition: target.transition,
    };

    setProject((prev) => {
      const frames = [...prev.frames];
      frames.splice(index + 1, 0, duplicated);
      return {
        ...prev,
        frames,
        currentFrameIndex: index + 1,
      };
    });
  };

  const handleDeleteFrame = (index: number) => {
    if (project.frames.length <= 1) return;
    recordHistory('Excluir Quadro');
    setProject((prev) => {
      const frames = prev.frames.filter((_, i) => i !== index);
      const nextIdx = Math.min(index, frames.length - 1);
      return {
        ...prev,
        frames,
        currentFrameIndex: nextIdx,
      };
    });
  };

  const handleCopyFrame = (index: number) => {
    const frame = project.frames[index];
    if (frame) {
      setCopiedFrame(JSON.parse(JSON.stringify(frame)));
    }
  };

  const handlePasteFrame = (index: number) => {
    if (!copiedFrame) return;
    recordHistory('Colar Quadro');
    setProject((prev) => {
      const frames = [...prev.frames];
      frames[index] = {
        ...frames[index],
        layers: { ...copiedFrame.layers },
        thumbnail: copiedFrame.thumbnail,
      };
      return {
        ...prev,
        frames,
      };
    });
  };

  const handleUpdateFrameHold = (index: number, hold: number) => {
    recordHistory('Ajustar Duração do Quadro');
    setProject((prev) => {
      const frames = [...prev.frames];
      if (frames[index]) {
        frames[index] = { ...frames[index], holdFrames: hold };
      }
      return { ...prev, frames };
    });
  };

  /**
   * Unlimited Layer Operations
   */
  const handleAddLayer = () => {
    recordHistory('Adicionar Camada');
    const newLayerId = `layer-${Date.now()}`;
    const newLayer: Layer = {
      id: newLayerId,
      name: `Camada ${project.layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1.0,
      blendMode: 'source-over',
      depthZ: 0,
      parallaxFactor: 1.0,
    };

    setProject((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      activeLayerId: newLayerId,
    }));
  };

  const handleDeleteLayer = (layerId: string) => {
    if (project.layers.length <= 1) return;
    recordHistory('Excluir Camada');
    setProject((prev) => {
      const filtered = prev.layers.filter((l) => l.id !== layerId);
      return {
        ...prev,
        layers: filtered,
        activeLayerId: filtered[filtered.length - 1].id,
      };
    });
  };

  const handleDuplicateLayer = (layerId: string) => {
    recordHistory('Duplicar Camada');
    const target = project.layers.find((l) => l.id === layerId);
    if (!target) return;

    const newId = `layer-${Date.now()}`;
    const duplicated: Layer = {
      ...target,
      id: newId,
      name: `${target.name} (Cópia)`,
    };

    setProject((prev) => {
      // Copy image content across all frames for this layer
      const frames = prev.frames.map((f) => ({
        ...f,
        layers: {
          ...f.layers,
          [newId]: f.layers[layerId] || '',
        },
      }));

      return {
        ...prev,
        layers: [...prev.layers, duplicated],
        frames,
        activeLayerId: newId,
      };
    });
  };

  const handleToggleLayerVisibility = (layerId: string) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    }));
  };

  const handleToggleLayerLock = (layerId: string) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l)),
    }));
  };

  const handleUpdateLayerOpacity = (layerId: string, opacity: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, opacity } : l)),
    }));
  };

  const handleUpdateLayerBlendMode = (layerId: string, blendMode: GlobalCompositeOperation) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, blendMode } : l)),
    }));
  };

  const handleUpdateLayerDepthZ = (layerId: string, depthZ: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, depthZ } : l)),
    }));
  };

  const handleReorderLayer = (layerId: string, direction: 'up' | 'down') => {
    recordHistory('Reordenar Camadas');
    setProject((prev) => {
      const idx = prev.layers.findIndex((l) => l.id === layerId);
      if (idx === -1) return prev;

      const targetIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (targetIdx < 0 || targetIdx >= prev.layers.length) return prev;

      const layers = [...prev.layers];
      const [removed] = layers.splice(idx, 1);
      layers.splice(targetIdx, 0, removed);

      return { ...prev, layers };
    });
  };

  const handleRenameLayer = (layerId: string, newName: string) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, name: newName } : l)),
    }));
  };

  const handleClearActiveLayer = () => {
    recordHistory('Limpar Camada');
    setProject((prev) => {
      const curFrame = prev.frames[prev.currentFrameIndex];
      const updatedLayers = { ...curFrame.layers, [prev.activeLayerId]: '' };
      const frames = [...prev.frames];
      frames[prev.currentFrameIndex] = { ...curFrame, layers: updatedLayers };
      return { ...prev, frames };
    });
  };

  /**
   * Selection Actions (Commit, Duplicate to next frame, Flip, Delete)
   */
  const handleCommitSelection = () => {
    setSelection(null);
  };

  const handleDuplicateSelectionToNextFrame = () => {
    if (!selection || !selection.extractedCanvas) return;
    recordHistory('Duplicar Seleção para Próximo Quadro');

    // Add or move to next frame
    let nextIdx = project.currentFrameIndex + 1;
    if (nextIdx >= project.frames.length) {
      handleAddFrame(true);
    } else {
      setProject((p) => ({ ...p, currentFrameIndex: nextIdx }));
    }
  };

  const handleDeleteSelection = () => {
    setSelection(null);
    recordHistory('Excluir Seleção');
  };

  const handleFlipSelectionH = () => {
    if (!selection) return;
    setSelection({
      ...selection,
      scale: { ...selection.scale, x: selection.scale.x * -1 },
    });
  };

  const handleFlipSelectionV = () => {
    if (!selection) return;
    setSelection({
      ...selection,
      scale: { ...selection.scale, y: selection.scale.y * -1 },
    });
  };

  /**
   * 3D Camera Controls
   */
  const handleUpdateCamera = (newCam: Partial<typeof project.camera3D>) => {
    setProject((prev) => ({
      ...prev,
      camera3D: { ...prev.camera3D, ...newCam },
    }));
  };

  const handleResetCamera = () => {
    setProject((prev) => ({
      ...prev,
      camera3D: {
        ...prev.camera3D,
        x: 0,
        y: 0,
        zoom: 1.0,
        rotation: 0,
        pitch: 0,
        yaw: 0,
      },
    }));
  };

  const handleAddCameraKeyframe = () => {
    const curIdx = project.currentFrameIndex;
    const cam = project.camera3D;
    const keyframe = {
      frameIndex: curIdx,
      x: cam.x,
      y: cam.y,
      zoom: cam.zoom,
      rotation: cam.rotation,
      pitch: cam.pitch,
      yaw: cam.yaw,
    };

    setProject((prev) => {
      const filtered = prev.camera3D.keyframes.filter((k) => k.frameIndex !== curIdx);
      return {
        ...prev,
        camera3D: {
          ...prev.camera3D,
          keyframes: [...filtered, keyframe].sort((a, b) => a.frameIndex - b.frameIndex),
        },
      };
    });
  };

  const handleRemoveCameraKeyframe = (frameIndex: number) => {
    setProject((prev) => ({
      ...prev,
      camera3D: {
        ...prev.camera3D,
        keyframes: prev.camera3D.keyframes.filter((k) => k.frameIndex !== frameIndex),
      },
    }));
  };

  const handleApplyCameraPreset = (preset: 'dolly' | 'pan-left-right' | 'cinematic-zoom' | 'handheld') => {
    switch (preset) {
      case 'cinematic-zoom':
        handleUpdateCamera({ zoom: 1.8, pitch: 8, yaw: -6 });
        break;
      case 'pan-left-right':
        handleUpdateCamera({ x: 180, zoom: 1.15 });
        break;
      case 'dolly':
        handleUpdateCamera({ zoom: 2.2, y: -60, pitch: -12 });
        break;
      case 'handheld':
        handleUpdateCamera({ rotation: 3.5, x: 25, y: -15 });
        break;
    }
  };

  /**
   * Skeletal Bone Controls
   */
  const handleUpdateBones = (bones: Bone[]) => {
    setProject((prev) => ({ ...prev, bones }));
  };

  const handleSelectBone = (boneId: string | null) => {
    setProject((prev) => ({ ...prev, activeBoneId: boneId || undefined }));
  };

  const handleSaveBonePose = () => {
    recordHistory('Gravar Pose Óssea');
    soundEffects.play('pop', 0.6);
  };

  const activeLayer = project.layers.find((l) => l.id === project.activeLayerId) || project.layers[0];

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* 1. Header / TopBar */}
      <TopBar
        projectTitle={project.title}
        onUpdateTitle={(title) => setProject((p) => ({ ...p, title }))}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={canvasSettings.zoom}
        onZoomChange={(zoom) => setCanvasSettings((c) => ({ ...c, zoom }))}
        onResetZoom={() => setCanvasSettings((c) => ({ ...c, zoom: 1.0, panX: 0, panY: 0 }))}
        isFlipped={canvasSettings.flippedHorizontal}
        onToggleFlip={() => setCanvasSettings((c) => ({ ...c, flippedHorizontal: !c.flippedHorizontal }))}
        onionSkin={onionSkin}
        onUpdateOnionSkin={(cfg) => setOnionSkin((o) => ({ ...o, ...cfg }))}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenProjectModal={() => setShowProjectModal(true)}
        onOpenShortcuts={() => setShowShortcutsModal(true)}
        onOpenTransitions={() => setTransitionModalFrameIndex(project.currentFrameIndex)}
        onOpenInstallModal={() => setShowInstallModal(true)}
        layersPanelOpen={layersPanelOpen}
        onToggleLayersPanel={() => setLayersPanelOpen((l) => !l)}
        width={project.width}
        height={project.height}
        fps={project.fps}
      />

      {/* 2. Middle Row: Left Toolbar + Center Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Vertical Toolbar */}
        <Toolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          brushPreset={brush.preset}
          onSelectBrushPreset={(preset) => setBrush((b) => ({ ...b, preset }))}
          brushColor={brush.color}
          onSelectColor={(color) => setBrush((b) => ({ ...b, color }))}
          brushSize={brush.size}
          activeShape={activeShape}
          onSelectShape={setActiveShape}
          onToggleCamera3D={() => setShowCamera3DPanel((prev) => !prev)}
          camera3DActive={project.camera3D.enabled}
        />

        {/* Center Drawing Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Contextual Properties Panel (Brush / Selection / Bone) */}
          {activeTool === 'bone' ? (
            <BoneToolPanel
              bones={project.bones || []}
              activeBoneId={project.activeBoneId}
              boneMode={project.boneMode || 'pose'}
              onChangeBoneMode={(mode) => setProject((p) => ({ ...p, boneMode: mode }))}
              onSelectBone={handleSelectBone}
              onUpdateBones={handleUpdateBones}
              activeLayer={activeLayer}
              onBindLayerToBone={(layerId, boneId) => {
                setProject((p) => ({
                  ...p,
                  layers: p.layers.map((l) => (l.id === layerId ? { ...l, boundBoneId: boneId } : l)),
                }));
              }}
              onSavePoseToFrame={handleSaveBonePose}
              currentFrameIndex={project.currentFrameIndex}
            />
          ) : (
            <ToolPropertiesPanel
              activeTool={activeTool}
              brush={brush}
              onUpdateBrush={(newB) => setBrush((b) => ({ ...b, ...newB }))}
              smartFill={smartFill}
              onUpdateSmartFill={(newF) => setSmartFill((f) => ({ ...f, ...newF }))}
              magicWand={magicWand}
              onUpdateMagicWand={(newW) => setMagicWand((w) => ({ ...w, ...newW }))}
              selection={selection}
              onCommitSelection={handleCommitSelection}
              onDuplicateSelectionToNextFrame={handleDuplicateSelectionToNextFrame}
              onDeleteSelection={handleDeleteSelection}
              onCancelSelection={() => setSelection(null)}
              onFlipSelectionH={handleFlipSelectionH}
              onFlipSelectionV={handleFlipSelectionV}
              activeShape={activeShape}
              onSelectShape={setActiveShape}
            />
          )}

          {/* Interactive Multi-layer Canvas */}
          <CanvasArea
            project={project}
            activeTool={activeTool}
            brush={brush}
            smartFill={smartFill}
            magicWand={magicWand}
            activeShape={activeShape}
            onionSkin={onionSkin}
            canvasSettings={canvasSettings}
            onUpdateCanvasSettings={(newS) => setCanvasSettings((c) => ({ ...c, ...newS }))}
            selection={selection}
            onUpdateSelection={setSelection}
            onSaveActiveLayerCanvas={handleSaveActiveLayerCanvas}
            onEyedropperPickColor={(color) => setBrush((b) => ({ ...b, color }))}
            onRecordHistory={recordHistory}
            onUpdateBones={handleUpdateBones}
            onSelectBone={handleSelectBone}
          />
        </div>

        {/* 3D Camera Floating Panel */}
        {showCamera3DPanel && (
          <Camera3DControls
            camera={project.camera3D}
            onUpdateCamera={handleUpdateCamera}
            currentFrameIndex={project.currentFrameIndex}
            onAddKeyframe={handleAddCameraKeyframe}
            onRemoveKeyframe={handleRemoveCameraKeyframe}
            onResetCamera={handleResetCamera}
            onApplyPreset={handleApplyCameraPreset}
          />
        )}

        {/* Unlimited Layers Panel */}
        {layersPanelOpen && (
          <LayersPanel
            layers={project.layers}
            activeLayerId={project.activeLayerId}
            onSelectLayer={(id) => setProject((p) => ({ ...p, activeLayerId: id }))}
            onAddLayer={handleAddLayer}
            onDeleteLayer={handleDeleteLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onToggleVisibility={handleToggleLayerVisibility}
            onToggleLock={handleToggleLayerLock}
            onUpdateOpacity={handleUpdateLayerOpacity}
            onUpdateBlendMode={handleUpdateLayerBlendMode}
            onUpdateDepthZ={handleUpdateLayerDepthZ}
            onReorderLayer={handleReorderLayer}
            onRenameLayer={handleRenameLayer}
            onClearActiveLayer={handleClearActiveLayer}
            onClose={() => setLayersPanelOpen(false)}
          />
        )}
      </div>

      {/* 3. Bottom Timeline */}
      <Timeline
        frames={project.frames}
        currentFrameIndex={project.currentFrameIndex}
        onSelectFrame={(idx) => setProject((p) => ({ ...p, currentFrameIndex: idx }))}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        loopMode={loopMode}
        onToggleLoopMode={() => {
          setLoopMode((m) => (m === 'loop' ? 'ping-pong' : m === 'ping-pong' ? 'once' : 'loop'));
        }}
        fps={project.fps}
        onChangeFps={(fps) => setProject((p) => ({ ...p, fps }))}
        onAddFrame={handleAddFrame}
        onDuplicateFrame={handleDuplicateFrame}
        onDeleteFrame={handleDeleteFrame}
        onCopyFrame={handleCopyFrame}
        onPasteFrame={handlePasteFrame}
        hasCopiedFrame={copiedFrame !== null}
        onUpdateFrameHold={handleUpdateFrameHold}
        onOpenTransitionModal={(frameIdx) => setTransitionModalFrameIndex(frameIdx)}
        onReorderFrame={(from, to) => {
          recordHistory('Reordenar Quadros');
          setProject((prev) => {
            const frames = [...prev.frames];
            const [item] = frames.splice(from, 1);
            frames.splice(to, 0, item);
            return { ...prev, frames, currentFrameIndex: to };
          });
        }}
      />

      {/* 4. Transition Effect Modal */}
      {transitionModalFrameIndex !== null && (
        <TransitionModal
          frameIndex={transitionModalFrameIndex}
          currentTransition={project.frames[transitionModalFrameIndex]?.transition}
          frameAThumbnail={project.frames[transitionModalFrameIndex]?.thumbnail}
          frameBThumbnail={project.frames[transitionModalFrameIndex + 1]?.thumbnail}
          fps={project.fps}
          onSaveTransition={(trans) => {
            recordHistory('Configurar Transição');
            setProject((prev) => {
              const frames = [...prev.frames];
              if (frames[transitionModalFrameIndex]) {
                frames[transitionModalFrameIndex] = {
                  ...frames[transitionModalFrameIndex],
                  transition: trans,
                };
              }
              return { ...prev, frames };
            });
          }}
          onRemoveTransition={() => {
            recordHistory('Remover Transição');
            setProject((prev) => {
              const frames = [...prev.frames];
              if (frames[transitionModalFrameIndex]) {
                frames[transitionModalFrameIndex] = {
                  ...frames[transitionModalFrameIndex],
                  transition: undefined,
                };
              }
              return { ...prev, frames };
            });
          }}
          onClose={() => setTransitionModalFrameIndex(null)}
        />
      )}

      {/* 5. High-Resolution Export Modal */}
      {showExportModal && (
        <ExportModal
          project={project}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* 6. Project Settings / Sample Projects Modal */}
      {showProjectModal && (
        <ProjectSettingsModal
          onLoadProject={(newProj) => {
            recordHistory('Carregar Projeto');
            setProject(newProj);
          }}
          onClose={() => setShowProjectModal(false)}
        />
      )}

      {/* 7. Keyboard Shortcuts Guide */}
      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}

      {/* 8. Download / Install App Modal */}
      {showInstallModal && (
        <InstallAppModal onClose={() => setShowInstallModal(false)} />
      )}

      {/* Floating Mobile Install Button (Easy to find on phones!) */}
      <div className="fixed bottom-36 right-3 sm:hidden z-40">
        <button
          onClick={() => setShowInstallModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-white font-bold text-xs rounded-full shadow-2xl border border-white/20 active:scale-95 animate-pulse"
        >
          <span className="text-sm">📲</span>
          <span>Instalar no Celular</span>
        </button>
      </div>
    </div>
  );
}
