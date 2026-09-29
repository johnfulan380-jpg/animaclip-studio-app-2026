import React from 'react';
import { 
  Camera, 
  RotateCcw, 
  Maximize2, 
  Move, 
  Sparkles, 
  Key, 
  Trash2, 
  Eye, 
  Play, 
  Layers,
  Compass,
  Video
} from 'lucide-react';
import { Camera3DConfig, Camera3DKeyframe } from '../types/animation';

interface Camera3DControlsProps {
  camera: Camera3DConfig;
  onUpdateCamera: (newCamera: Partial<Camera3DConfig>) => void;
  currentFrameIndex: number;
  onAddKeyframe: () => void;
  onRemoveKeyframe: (frameIndex: number) => void;
  onResetCamera: () => void;
  onApplyPreset: (preset: 'dolly' | 'pan-left-right' | 'cinematic-zoom' | 'handheld') => void;
}

export const Camera3DControls: React.FC<Camera3DControlsProps> = ({
  camera,
  onUpdateCamera,
  currentFrameIndex,
  onAddKeyframe,
  onRemoveKeyframe,
  onResetCamera,
  onApplyPreset,
}) => {
  const currentKeyframe = camera.keyframes.find((k) => k.frameIndex === currentFrameIndex);

  return (
    <div className="absolute left-20 top-14 w-80 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl z-30 p-4 text-xs text-neutral-200 select-none animate-in fade-in zoom-in-95 duration-150 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-900/50">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-neutral-100">Câmera 3D & Parallax</h3>
            <p className="text-[10px] text-neutral-400">Multiplano e Profundidade Espacial</p>
          </div>
        </div>

        <button
          onClick={() => onUpdateCamera({ enabled: !camera.enabled })}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
            camera.enabled
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          {camera.enabled ? 'ATIVADA' : 'DESATIVADA'}
        </button>
      </div>

      {camera.enabled && (
        <>
          {/* View Mode Toggle */}
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => onUpdateCamera({ viewMode: 'camera' })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                camera.viewMode === 'camera'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Visão da Câmera</span>
            </button>
            <button
              onClick={() => onUpdateCamera({ viewMode: 'stage' })}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                camera.viewMode === 'stage'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Palco Completo</span>
            </button>
          </div>

          {/* Pan & Zoom Controls */}
          <div className="space-y-2 bg-neutral-950/50 p-3 rounded-xl border border-neutral-800">
            {/* Pan X */}
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Pan Horizontal (X):</span>
                <span className="font-mono text-neutral-200 tabular-nums">{Math.round(camera.x)}px</span>
              </div>
              <input
                type="range"
                min="-600"
                max="600"
                value={camera.x}
                onChange={(e) => onUpdateCamera({ x: parseInt(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Pan Y */}
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Pan Vertical (Y):</span>
                <span className="font-mono text-neutral-200 tabular-nums">{Math.round(camera.y)}px</span>
              </div>
              <input
                type="range"
                min="-400"
                max="400"
                value={camera.y}
                onChange={(e) => onUpdateCamera({ y: parseInt(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Zoom / Dolly */}
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Zoom / Distância Focal:</span>
                <span className="font-mono text-neutral-200 tabular-nums">{camera.zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.05"
                value={camera.zoom}
                onChange={(e) => onUpdateCamera({ zoom: parseFloat(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Roll / Rotation */}
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Giro / Roll da Câmera:</span>
                <span className="font-mono text-neutral-200 tabular-nums">{Math.round(camera.rotation)}°</span>
              </div>
              <input
                type="range"
                min="-45"
                max="45"
                value={camera.rotation}
                onChange={(e) => onUpdateCamera({ rotation: parseInt(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* 3D Perspective Angles (Pitch / Yaw) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Inclinação 3D (Pitch):</span>
                <input
                  type="range"
                  min="-25"
                  max="25"
                  value={camera.pitch}
                  onChange={(e) => onUpdateCamera({ pitch: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block mb-1">Giro 3D (Yaw):</span>
                <input
                  type="range"
                  min="-25"
                  max="25"
                  value={camera.yaw}
                  onChange={(e) => onUpdateCamera({ yaw: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Parallax & Multiplane Option */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={camera.enableParallax}
                onChange={(e) => onUpdateCamera({ enableParallax: e.target.checked })}
                className="accent-blue-500 rounded"
              />
              <span className="font-medium">Parallax Multiplano (Profundidade 3D)</span>
            </label>

            <button
              onClick={onResetCamera}
              title="Redefinir Câmera para o Centro"
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Keyframing for Camera Moves */}
          <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-neutral-300 font-medium">
                Keyframe no Quadro {currentFrameIndex + 1}:
              </span>
            </div>

            {currentKeyframe ? (
              <button
                onClick={() => onRemoveKeyframe(currentFrameIndex)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-900/40 text-red-300 hover:bg-red-800/60 text-[11px] font-medium transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remover</span>
              </button>
            ) : (
              <button
                onClick={onAddKeyframe}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-medium transition-colors"
              >
                <span>Gravar Posição</span>
              </button>
            )}
          </div>

          {/* Cinematic Presets */}
          <div className="pt-2 border-t border-neutral-800">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold block mb-1.5">
              Movimentos Prontos
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onApplyPreset('cinematic-zoom')}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] transition-colors text-left"
              >
                🔍 Zoom Cinemático
              </button>
              <button
                onClick={() => onApplyPreset('pan-left-right')}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] transition-colors text-left"
              >
                ↔️ Pan Lateral
              </button>
              <button
                onClick={() => onApplyPreset('dolly')}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] transition-colors text-left"
              >
                🎬 Efeito Vertigo
              </button>
              <button
                onClick={() => onApplyPreset('handheld')}
                className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] transition-colors text-left"
              >
                👋 Câmera na Mão
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
