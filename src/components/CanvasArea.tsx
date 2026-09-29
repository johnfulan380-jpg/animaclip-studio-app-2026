import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  AnimationProject, 
  BrushDynamics, 
  ToolType, 
  SmartFillSettings, 
  MagicWandSettings, 
  SelectionState, 
  ShapeType,
  OnionSkinConfig,
  CanvasSettings,
  Bone
} from '../types/animation';
import { smoothPoints, renderStrokeSegment, StrokePoint } from '../utils/brushEngine';
import { smartFloodFill } from '../utils/floodFill';
import { extractLassoSelection, extractMagicWandSelection, stampSelection } from '../utils/selectionUtils';
import { drawSkeletalBones, hitTestBone, rotateBoneFK, translateBoneTree } from '../utils/skeletalEngine';

interface CanvasAreaProps {
  project: AnimationProject;
  activeTool: ToolType;
  brush: BrushDynamics;
  smartFill: SmartFillSettings;
  magicWand: MagicWandSettings;
  activeShape: ShapeType;
  onionSkin: OnionSkinConfig;
  canvasSettings: CanvasSettings;
  onUpdateCanvasSettings: (newSettings: Partial<CanvasSettings>) => void;
  selection: SelectionState | null;
  onUpdateSelection: (selection: SelectionState | null) => void;
  onSaveActiveLayerCanvas: (dataUrl: string) => void;
  onEyedropperPickColor: (hex: string) => void;
  onRecordHistory: (description: string) => void;
  onUpdateBones?: (bones: Bone[]) => void;
  onSelectBone?: (boneId: string | null) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  project,
  activeTool,
  brush,
  smartFill,
  magicWand,
  activeShape,
  onionSkin,
  canvasSettings,
  onUpdateCanvasSettings,
  selection,
  onUpdateSelection,
  onSaveActiveLayerCanvas,
  onEyedropperPickColor,
  onRecordHistory,
  onUpdateBones,
  onSelectBone,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const onionCanvasRef = useRef<HTMLCanvasElement>(null);
  const boneCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const strokePointsRef = useRef<StrokePoint[]>([]);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const lassoPolygonRef = useRef<{ x: number; y: number }[]>([]);

  // Bone manipulation ref
  const boneDragRef = useRef<{
    boneId: string;
    dragMode: 'rotate' | 'translate';
    startPoint: { x: number; y: number };
    initialAngle: number;
    pivot: { x: number; y: number };
  } | null>(null);

  // Bone creation start point
  const boneCreateStartRef = useRef<{ x: number; y: number } | null>(null);

  const transformDragRef = useRef<{
    startX: number;
    startY: number;
    initialPos: { x: number; y: number };
    initialScale: { x: number; y: number };
    initialRotation: number;
    handle: string;
  } | null>(null);

  const currentFrame = project.frames[project.currentFrameIndex] || project.frames[0];
  const activeLayer = project.layers.find((l) => l.id === project.activeLayerId) || project.layers[0];
  const camera = project.camera3D;
  const bones = project.bones || [];
  const activeBoneId = project.activeBoneId || null;
  const boneMode = project.boneMode || 'pose';

  const loadLayerImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img);
      img.src = url;
    });
  }, []);

  const renderAllLayers = useCallback(async () => {
    const actCanvas = activeCanvasRef.current;
    const compCanvas = compositeCanvasRef.current;
    if (!actCanvas || !compCanvas) return;

    const actCtx = actCanvas.getContext('2d')!;
    const compCtx = compCanvas.getContext('2d')!;

    actCtx.clearRect(0, 0, actCanvas.width, actCanvas.height);
    compCtx.clearRect(0, 0, compCanvas.width, compCanvas.height);

    for (const layer of project.layers) {
      if (!layer.visible) continue;

      const layerUrl = currentFrame?.layers[layer.id];
      if (layerUrl) {
        const img = await loadLayerImage(layerUrl);
        
        let parallaxX = 0;
        let parallaxY = 0;
        if (camera && camera.enabled && camera.enableParallax && camera.viewMode === 'camera') {
          const depthFactor = (layer.depthZ || 0) / 400;
          parallaxX = -camera.x * depthFactor * 0.5;
          parallaxY = -camera.y * depthFactor * 0.5;
        }

        compCtx.save();
        compCtx.globalAlpha = layer.opacity;
        compCtx.globalCompositeOperation = layer.blendMode || 'source-over';
        compCtx.drawImage(img, parallaxX, parallaxY);
        compCtx.restore();

        if (layer.id === project.activeLayerId) {
          actCtx.save();
          actCtx.drawImage(img, 0, 0);
          actCtx.restore();
        }
      }
    }
  }, [project.layers, project.activeLayerId, currentFrame, camera, loadLayerImage]);

  const renderOnionSkin = useCallback(async () => {
    const oCanvas = onionCanvasRef.current;
    if (!oCanvas) return;
    const oCtx = oCanvas.getContext('2d')!;
    oCtx.clearRect(0, 0, oCanvas.width, oCanvas.height);

    if (!onionSkin.enabled) return;

    const curIdx = project.currentFrameIndex;

    for (let p = 1; p <= onionSkin.prevFrames; p++) {
      const prevIdx = curIdx - p;
      if (prevIdx >= 0) {
        const prevFrame = project.frames[prevIdx];
        if (!prevFrame) continue;

        const alpha = (onionSkin.opacity / p);
        oCtx.save();
        oCtx.globalAlpha = alpha;

        for (const layer of project.layers) {
          if (!layer.visible) continue;
          const url = prevFrame.layers[layer.id];
          if (url) {
            const img = await loadLayerImage(url);
            oCtx.drawImage(img, 0, 0);
          }
        }

        if (onionSkin.coloredTint) {
          oCtx.globalCompositeOperation = 'source-in';
          oCtx.fillStyle = onionSkin.prevColor || '#ef4444';
          oCtx.fillRect(0, 0, oCanvas.width, oCanvas.height);
        }
        oCtx.restore();
      }
    }

    for (let n = 1; n <= onionSkin.nextFrames; n++) {
      const nextIdx = curIdx + n;
      if (nextIdx < project.frames.length) {
        const nextFrame = project.frames[nextIdx];
        if (!nextFrame) continue;

        const alpha = (onionSkin.opacity / n);
        oCtx.save();
        oCtx.globalAlpha = alpha;

        for (const layer of project.layers) {
          if (!layer.visible) continue;
          const url = nextFrame.layers[layer.id];
          if (url) {
            const img = await loadLayerImage(url);
            oCtx.drawImage(img, 0, 0);
          }
        }

        if (onionSkin.coloredTint) {
          oCtx.globalCompositeOperation = 'source-in';
          oCtx.fillStyle = onionSkin.nextColor || '#22c55e';
          oCtx.fillRect(0, 0, oCanvas.width, oCanvas.height);
        }
        oCtx.restore();
      }
    }
  }, [onionSkin, project.currentFrameIndex, project.frames, project.layers, loadLayerImage]);

  // Render Skeletal Bones overlay
  const renderBonesOverlay = useCallback(() => {
    const bCanvas = boneCanvasRef.current;
    if (!bCanvas) return;
    const bCtx = bCanvas.getContext('2d')!;
    bCtx.clearRect(0, 0, bCanvas.width, bCanvas.height);

    if (activeTool === 'bone' || bones.length > 0) {
      drawSkeletalBones(bCtx, bones, activeBoneId, boneMode === 'pose');
    }
  }, [bones, activeBoneId, activeTool, boneMode]);

  useEffect(() => {
    renderAllLayers();
    renderOnionSkin();
    renderBonesOverlay();
  }, [renderAllLayers, renderOnionSkin, renderBonesOverlay]);

  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;

    if (canvasSettings.flippedHorizontal) {
      x = canvas.width - x;
    }

    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 1 || e.buttons === 4 || e.altKey || (e.buttons === 1 && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasSettings.panX, y: e.clientY - canvasSettings.panY });
      return;
    }

    if (e.button !== 0) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);

    // 1. SKELETAL BONE INTERACTION (Posing & Rigging)
    if (activeTool === 'bone') {
      if (boneMode === 'pose') {
        const hit = hitTestBone(bones, coords.x, coords.y, 22);
        if (hit) {
          if (onSelectBone) onSelectBone(hit.bone.id);
          const isRoot = !hit.bone.parentId;
          const isTranslate = isRoot && hit.hitPart === 'start';

          boneDragRef.current = {
            boneId: hit.bone.id,
            dragMode: isTranslate ? 'translate' : 'rotate',
            startPoint: coords,
            initialAngle: hit.bone.angle,
            pivot: hit.bone.startPoint,
          };
          setIsDrawing(true);
          return;
        } else {
          if (onSelectBone) onSelectBone(null);
        }
      } else if (boneMode === 'create') {
        setIsDrawing(true);
        boneCreateStartRef.current = coords;
        return;
      }
      return;
    }

    if (activeLayer.locked || !activeLayer.visible) return;

    // 2. Transforming active selection
    if (selection && selection.isActive) {
      const bounds = selection.bounds;
      const curPos = selection.currentPos;
      const selW = bounds.width * selection.scale.x;
      const selH = bounds.height * selection.scale.y;

      const isInside = (
        coords.x >= curPos.x - 10 &&
        coords.x <= curPos.x + selW + 10 &&
        coords.y >= curPos.y - 10 &&
        coords.y <= curPos.y + selH + 10
      );

      if (isInside) {
        transformDragRef.current = {
          startX: coords.x,
          startY: coords.y,
          initialPos: { ...curPos },
          initialScale: { ...selection.scale },
          initialRotation: selection.rotation,
          handle: 'move',
        };
        setIsDrawing(true);
        return;
      } else {
        stampSelectionToLayer();
        return;
      }
    }

    // 3. Eyedropper
    if (activeTool === 'eyedropper') {
      const compCanvas = compositeCanvasRef.current;
      if (!compCanvas) return;
      const compCtx = compCanvas.getContext('2d')!;
      const pixel = compCtx.getImageData(Math.floor(coords.x), Math.floor(coords.y), 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
      onEyedropperPickColor(hex);
      return;
    }

    // 4. Smart Bucket
    if (activeTool === 'bucket') {
      const actCanvas = activeCanvasRef.current;
      const compCanvas = compositeCanvasRef.current;
      if (!actCanvas || !compCanvas) return;

      const actCtx = actCanvas.getContext('2d')!;
      const sampleCtx = smartFill.sampleAllLayers ? compCanvas.getContext('2d')! : actCtx;

      const success = smartFloodFill(
        actCtx,
        sampleCtx,
        coords.x,
        coords.y,
        brush.color,
        smartFill
      );

      if (success) {
        onSaveActiveLayerCanvas(actCanvas.toDataURL('image/png'));
        onRecordHistory('Preenchimento com Balde de Tinta');
        renderAllLayers();
      }
      return;
    }

    // 5. Magic Wand
    if (activeTool === 'magic-wand') {
      const actCanvas = activeCanvasRef.current;
      const compCanvas = compositeCanvasRef.current;
      if (!actCanvas || !compCanvas) return;

      const actCtx = actCanvas.getContext('2d')!;
      const sampleCtx = magicWand.sampleAllLayers ? compCanvas.getContext('2d')! : actCtx;

      const newSelection = extractMagicWandSelection(
        actCtx,
        sampleCtx,
        coords.x,
        coords.y,
        magicWand,
        activeLayer.id
      );

      if (newSelection) {
        onUpdateSelection(newSelection);
        onRecordHistory('Seleção com Varinha Mágica');
        renderAllLayers();
      }
      return;
    }

    // 6. Freehand Lasso
    if (activeTool === 'lasso') {
      setIsDrawing(true);
      lassoPolygonRef.current = [coords];
      return;
    }

    // 7. Shapes
    if (activeTool === 'shape') {
      setIsDrawing(true);
      shapeStartRef.current = coords;
      return;
    }

    // 8. Text Stamp
    if (activeTool === 'text') {
      const text = prompt('Digite o texto a ser carimbado na tela:', 'AnimaClip');
      if (text && text.trim()) {
        const actCanvas = activeCanvasRef.current;
        if (!actCanvas) return;
        const actCtx = actCanvas.getContext('2d')!;

        actCtx.save();
        actCtx.font = `bold ${Math.max(16, brush.size * 2)}px 'Outfit', sans-serif`;
        actCtx.fillStyle = brush.color;
        actCtx.globalAlpha = brush.opacity;
        actCtx.fillText(text.trim(), coords.x, coords.y);
        actCtx.restore();

        onSaveActiveLayerCanvas(actCanvas.toDataURL('image/png'));
        onRecordHistory('Carimbo de Texto');
        renderAllLayers();
      }
      return;
    }

    // 9. Brush / Eraser
    setIsDrawing(true);
    const newPt: StrokePoint = {
      x: coords.x,
      y: coords.y,
      time: Date.now(),
      pressure: (e as any).pressure || 0.5,
    };
    strokePointsRef.current = [newPt];

    const actCanvas = activeCanvasRef.current;
    if (actCanvas) {
      const actCtx = actCanvas.getContext('2d')!;
      renderStrokeSegment(actCtx, newPt, newPt, null, brush, activeTool === 'eraser');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      onUpdateCanvasSettings({
        panX: e.clientX - panStart.x,
        panY: e.clientY - panStart.y,
      });
      return;
    }

    if (!isDrawing) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);

    // 1. SKELETAL BONE DRAGGING / POSING
    if (activeTool === 'bone') {
      if (boneMode === 'pose' && boneDragRef.current && onUpdateBones) {
        const drag = boneDragRef.current;
        if (drag.dragMode === 'translate') {
          // Translate root bone tree
          const dx = coords.x - drag.startPoint.x;
          const dy = coords.y - drag.startPoint.y;
          const updated = translateBoneTree(bones, drag.boneId, dx, dy);
          onUpdateBones(updated);
          drag.startPoint = coords;
        } else {
          // Rotate bone around joint via Forward Kinematics
          const angleRad = Math.atan2(coords.y - drag.pivot.y, coords.x - drag.pivot.x);
          const angleDeg = (angleRad * 180) / Math.PI;
          const updated = rotateBoneFK(bones, drag.boneId, angleDeg);
          onUpdateBones(updated);
        }
        return;
      }

      if (boneMode === 'create' && boneCreateStartRef.current) {
        // Preview new bone line
        const prevCanvas = previewCanvasRef.current;
        if (prevCanvas) {
          const pCtx = prevCanvas.getContext('2d')!;
          pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
          pCtx.strokeStyle = '#f59e0b';
          pCtx.lineWidth = 4;
          pCtx.beginPath();
          pCtx.moveTo(boneCreateStartRef.current.x, boneCreateStartRef.current.y);
          pCtx.lineTo(coords.x, coords.y);
          pCtx.stroke();
        }
        return;
      }
      return;
    }

    if (selection && selection.isActive && transformDragRef.current) {
      const drag = transformDragRef.current;
      const dx = coords.x - drag.startX;
      const dy = coords.y - drag.startY;

      onUpdateSelection({
        ...selection,
        currentPos: {
          x: drag.initialPos.x + dx,
          y: drag.initialPos.y + dy,
        },
      });
      return;
    }

    if (activeTool === 'lasso') {
      lassoPolygonRef.current.push(coords);
      const prevCanvas = previewCanvasRef.current;
      if (prevCanvas) {
        const pCtx = prevCanvas.getContext('2d')!;
        pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
        pCtx.strokeStyle = '#ef4444';
        pCtx.lineWidth = 2;
        pCtx.setLineDash([4, 4]);
        pCtx.beginPath();
        lassoPolygonRef.current.forEach((pt, i) => {
          if (i === 0) pCtx.moveTo(pt.x, pt.y);
          else pCtx.lineTo(pt.x, pt.y);
        });
        pCtx.stroke();
        pCtx.setLineDash([]);
      }
      return;
    }

    if (activeTool === 'shape' && shapeStartRef.current) {
      const start = shapeStartRef.current;
      const prevCanvas = previewCanvasRef.current;
      if (prevCanvas) {
        const pCtx = prevCanvas.getContext('2d')!;
        pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
        pCtx.strokeStyle = brush.color;
        pCtx.fillStyle = brush.color;
        pCtx.lineWidth = brush.size;
        pCtx.globalAlpha = brush.opacity;

        pCtx.beginPath();
        if (activeShape === 'line') {
          pCtx.moveTo(start.x, start.y);
          pCtx.lineTo(coords.x, coords.y);
          pCtx.stroke();
        } else if (activeShape === 'rectangle') {
          pCtx.strokeRect(start.x, start.y, coords.x - start.x, coords.y - start.y);
        } else if (activeShape === 'circle') {
          const rx = Math.abs(coords.x - start.x) / 2;
          const ry = Math.abs(coords.y - start.y) / 2;
          const cx = Math.min(start.x, coords.x) + rx;
          const cy = Math.min(start.y, coords.y) + ry;
          pCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          pCtx.stroke();
        } else if (activeShape === 'arrow') {
          pCtx.moveTo(start.x, start.y);
          pCtx.lineTo(coords.x, coords.y);
          pCtx.stroke();
          const angle = Math.atan2(coords.y - start.y, coords.x - start.x);
          const headLen = Math.max(12, brush.size * 2.5);
          pCtx.beginPath();
          pCtx.moveTo(coords.x, coords.y);
          pCtx.lineTo(coords.x - headLen * Math.cos(angle - Math.PI / 6), coords.y - headLen * Math.sin(angle - Math.PI / 6));
          pCtx.lineTo(coords.x - headLen * Math.cos(angle + Math.PI / 6), coords.y - headLen * Math.sin(angle + Math.PI / 6));
          pCtx.closePath();
          pCtx.fill();
        }
      }
      return;
    }

    const actCanvas = activeCanvasRef.current;
    if (!actCanvas) return;
    const actCtx = actCanvas.getContext('2d')!;

    const newPt: StrokePoint = {
      x: coords.x,
      y: coords.y,
      time: Date.now(),
      pressure: (e as any).pressure || 0.5,
    };

    strokePointsRef.current.push(newPt);

    const smoothed = smoothPoints(strokePointsRef.current, brush.stabilizer);
    const len = smoothed.length;
    if (len >= 2) {
      const p1 = smoothed[len - 2];
      const p2 = smoothed[len - 1];
      const p3 = len >= 3 ? smoothed[len - 3] : null;
      renderStrokeSegment(actCtx, p1, p2, p3, brush, activeTool === 'eraser');
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    transformDragRef.current = null;

    // Bone finalize
    if (activeTool === 'bone') {
      if (boneMode === 'pose' && boneDragRef.current) {
        boneDragRef.current = null;
        onRecordHistory('Posicionar Osso do Personagem');
      } else if (boneMode === 'create' && boneCreateStartRef.current && onUpdateBones) {
        const start = boneCreateStartRef.current;
        const end = strokePointsRef.current[strokePointsRef.current.length - 1] || start;
        const len = Math.hypot(end.x - start.x, end.y - start.y);

        if (len > 15) {
          const angleDeg = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
          const newBone: Bone = {
            id: `bone-${Date.now()}`,
            name: `Osso ${bones.length + 1}`,
            parentId: activeBoneId,
            startPoint: start,
            endPoint: end,
            length: len,
            angle: angleDeg,
            color: '#38bdf8',
          };
          onUpdateBones([...bones, newBone]);
          if (onSelectBone) onSelectBone(newBone.id);
          onRecordHistory('Criar Novo Osso');
        }
        boneCreateStartRef.current = null;
      }

      const prevCanvas = previewCanvasRef.current;
      if (prevCanvas) {
        const pCtx = prevCanvas.getContext('2d')!;
        pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
      }
      return;
    }

    const prevCanvas = previewCanvasRef.current;
    if (prevCanvas) {
      const pCtx = prevCanvas.getContext('2d')!;
      pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);
    }

    const actCanvas = activeCanvasRef.current;
    if (!actCanvas) return;
    const actCtx = actCanvas.getContext('2d')!;

    if (activeTool === 'lasso' && lassoPolygonRef.current.length > 3) {
      const newSelection = extractLassoSelection(
        actCtx,
        lassoPolygonRef.current,
        activeLayer.id
      );
      lassoPolygonRef.current = [];
      if (newSelection) {
        onUpdateSelection(newSelection);
        onRecordHistory('Seleção com Laço');
        renderAllLayers();
      }
      return;
    }

    if (activeTool === 'shape' && shapeStartRef.current) {
      const start = shapeStartRef.current;
      const end = strokePointsRef.current[strokePointsRef.current.length - 1] || start;

      actCtx.save();
      actCtx.strokeStyle = brush.color;
      actCtx.fillStyle = brush.color;
      actCtx.lineWidth = brush.size;
      actCtx.globalAlpha = brush.opacity;

      actCtx.beginPath();
      if (activeShape === 'line') {
        actCtx.moveTo(start.x, start.y);
        actCtx.lineTo(end.x, end.y);
        actCtx.stroke();
      } else if (activeShape === 'rectangle') {
        actCtx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (activeShape === 'circle') {
        const rx = Math.abs(end.x - start.x) / 2;
        const ry = Math.abs(end.y - start.y) / 2;
        const cx = Math.min(start.x, end.x) + rx;
        const cy = Math.min(start.y, end.y) + ry;
        actCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        actCtx.stroke();
      } else if (activeShape === 'arrow') {
        actCtx.moveTo(start.x, start.y);
        actCtx.lineTo(end.x, end.y);
        actCtx.stroke();
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLen = Math.max(12, brush.size * 2.5);
        actCtx.beginPath();
        actCtx.moveTo(end.x, end.y);
        actCtx.lineTo(end.x - headLen * Math.cos(angle - Math.PI / 6), end.y - headLen * Math.sin(angle - Math.PI / 6));
        actCtx.lineTo(end.x - headLen * Math.cos(angle + Math.PI / 6), end.y - headLen * Math.sin(angle + Math.PI / 6));
        actCtx.closePath();
        actCtx.fill();
      }
      actCtx.restore();

      shapeStartRef.current = null;
      onSaveActiveLayerCanvas(actCanvas.toDataURL('image/png'));
      onRecordHistory(`Forma Geométrica (${activeShape})`);
      renderAllLayers();
      return;
    }

    if (activeTool === 'brush' || activeTool === 'eraser') {
      strokePointsRef.current = [];
      onSaveActiveLayerCanvas(actCanvas.toDataURL('image/png'));
      onRecordHistory(activeTool === 'eraser' ? 'Borracha' : `Pincel (${brush.preset})`);
      renderAllLayers();
    }
  };

  const stampSelectionToLayer = () => {
    if (!selection || !selection.isActive) return;
    const actCanvas = activeCanvasRef.current;
    if (!actCanvas) return;
    const actCtx = actCanvas.getContext('2d')!;

    stampSelection(actCtx, selection);
    onUpdateSelection(null);
    onSaveActiveLayerCanvas(actCanvas.toDataURL('image/png'));
    onRecordHistory('Fixar Seleção na Camada');
    renderAllLayers();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY * 0.002;
      const newZoom = Math.max(0.25, Math.min(4.0, canvasSettings.zoom + delta));
      onUpdateCanvasSettings({ zoom: newZoom });
    } else {
      onUpdateCanvasSettings({
        panX: canvasSettings.panX - e.deltaX,
        panY: canvasSettings.panY - e.deltaY,
      });
    }
  };

  const is3DCameraActive = camera && camera.enabled && camera.viewMode === 'camera';
  const cameraTransform = is3DCameraActive
    ? `perspective(${camera.perspective || 1000}px) translate3d(${-camera.x}px, ${-camera.y}px, 0) scale(${camera.zoom}) rotate(${camera.rotation}deg) rotateX(${camera.pitch}deg) rotateY(${camera.yaw}deg)`
    : '';

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="flex-1 w-full h-full bg-neutral-950 relative overflow-hidden flex items-center justify-center cursor-crosshair select-none"
    >
      <div
        style={{
          width: `${project.width}px`,
          height: `${project.height}px`,
          transform: `translate(${canvasSettings.panX}px, ${canvasSettings.panY}px) scale(${canvasSettings.zoom}) scaleX(${
            canvasSettings.flippedHorizontal ? -1 : 1
          }) ${cameraTransform}`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.05s ease-out',
        }}
        className="relative shadow-2xl rounded-sm border border-neutral-800"
      >
        {/* Layer 0: Background */}
        <div
          className="absolute inset-0 bg-canvas-checkered pointer-events-none rounded-sm"
          style={{
            backgroundColor: project.isTransparent ? 'transparent' : project.backgroundColor || '#ffffff',
          }}
        />

        {/* Layer 1: Onion Skin Canvas */}
        <canvas
          ref={onionCanvasRef}
          width={project.width}
          height={project.height}
          className="absolute inset-0 pointer-events-none rounded-sm"
        />

        {/* Layer 2: Inactive Layers Composite Canvas */}
        <canvas
          ref={compositeCanvasRef}
          width={project.width}
          height={project.height}
          className="absolute inset-0 pointer-events-none rounded-sm"
        />

        {/* Layer 3: Active Interactive Drawing Canvas */}
        <canvas
          ref={activeCanvasRef}
          width={project.width}
          height={project.height}
          className="absolute inset-0 rounded-sm"
        />

        {/* Layer 4: Live Preview Canvas */}
        <canvas
          ref={previewCanvasRef}
          width={project.width}
          height={project.height}
          className="absolute inset-0 pointer-events-none rounded-sm"
        />

        {/* Layer 5: Skeletal Bones Rigging Canvas */}
        <canvas
          ref={boneCanvasRef}
          width={project.width}
          height={project.height}
          className="absolute inset-0 pointer-events-none z-10 rounded-sm"
        />

        {/* Stage View Camera Framing Box */}
        {camera && camera.enabled && camera.viewMode === 'stage' && (
          <div
            style={{
              position: 'absolute',
              left: `${project.width / 2 + camera.x - (project.width / (2 * camera.zoom))}px`,
              top: `${project.height / 2 + camera.y - (project.height / (2 * camera.zoom))}px`,
              width: `${project.width / camera.zoom}px`,
              height: `${project.height / camera.zoom}px`,
              transform: `rotate(${camera.rotation}deg)`,
              transformOrigin: 'center center',
            }}
            className="border-2 border-blue-400 bg-blue-500/10 pointer-events-none z-20 flex items-start justify-between p-2 shadow-2xl"
          >
            <div className="bg-blue-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
              Enquadramento Câmera 3D ({camera.zoom.toFixed(2)}x)
            </div>
            <div className="w-3 h-3 border-t-2 border-r-2 border-blue-400" />
          </div>
        )}

        {/* Selection Overlay */}
        {selection && selection.isActive && selection.extractedCanvas && (
          <div
            style={{
              position: 'absolute',
              left: `${selection.currentPos.x}px`,
              top: `${selection.currentPos.y}px`,
              width: `${selection.bounds.width * selection.scale.x}px`,
              height: `${selection.bounds.height * selection.scale.y}px`,
              transform: `rotate(${selection.rotation}deg)`,
              transformOrigin: 'center center',
            }}
            className="border-2 border-dashed border-red-500 ring-2 ring-white/60 pointer-events-none z-20"
          >
            <img
              src={selection.extractedCanvas.toDataURL()}
              alt="Seleção"
              className="w-full h-full object-contain pointer-events-none"
            />
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500 rounded-sm" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500 rounded-sm" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-red-500 rounded-sm" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-red-500 rounded-sm" />
          </div>
        )}
      </div>

      {activeLayer.locked && activeTool !== 'bone' && (
        <div className="absolute bottom-6 px-4 py-2 bg-neutral-900/90 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold shadow-xl backdrop-blur pointer-events-none flex items-center gap-2">
          <span>Camada Bloqueada: Desbloqueie no painel de camadas para desenhar.</span>
        </div>
      )}
    </div>
  );
};
