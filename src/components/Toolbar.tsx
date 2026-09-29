import React, { useState } from 'react';
import { 
  Eraser, 
  PaintBucket, 
  Lasso, 
  Wand2, 
  Shapes, 
  Type, 
  Pipette,
  Paintbrush,
  Camera,
  GitCommit
} from 'lucide-react';
import { ToolType, BrushPresetType, ShapeType } from '../types/animation';

interface ToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  brushPreset: BrushPresetType;
  onSelectBrushPreset: (preset: BrushPresetType) => void;
  brushColor: string;
  onSelectColor: (color: string) => void;
  brushSize: number;
  activeShape: ShapeType;
  onSelectShape: (shape: ShapeType) => void;
  onToggleCamera3D: () => void;
  camera3DActive: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  brushPreset,
  onSelectBrushPreset,
  brushColor,
  onSelectColor,
  brushSize,
  activeShape,
  onSelectShape,
  onToggleCamera3D,
  camera3DActive,
}) => {
  const [showBrushMenu, setShowBrushMenu] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const quickColors = [
    '#000000', // Black
    '#ffffff', // White
    '#ef4444', // Red
    '#f97316', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#a855f7', // Purple
    '#ec4899', // Pink
    '#78716c', // Warm Gray
    '#334155', // Slate
  ];

  const brushPresets: { id: BrushPresetType; name: string; desc: string }[] = [
    { id: 'pen', name: 'Caneta de Animação', desc: 'Traço suave vetorizado com dinâmica' },
    { id: 'pencil', name: 'Lápis de Rascunho', desc: 'Grafite texturizado com granulação' },
    { id: 'marker', name: 'Marcador / Chanfrado', desc: 'Pincel translúcido de preenchimento' },
    { id: 'airbrush', name: 'Aerógrafo Suave', desc: 'Gradiente radial para sombras e blush' },
    { id: 'textured-ink', name: 'Tinta com Cerdas', desc: 'Estilo arte tradicional japonesa/ink' },
  ];

  const shapesList: { id: ShapeType; label: string }[] = [
    { id: 'line', label: 'Linha Reta' },
    { id: 'circle', label: 'Círculo / Elipse' },
    { id: 'rectangle', label: 'Retângulo / Quadrado' },
    { id: 'arrow', label: 'Seta de Ação' },
  ];

  return (
    <aside className="w-16 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-3 gap-2.5 z-20 shrink-0 select-none">
      {/* 1. Brush Tool with Presets popup */}
      <div className="relative">
        <button
          onClick={() => {
            if (activeTool === 'brush') {
              setShowBrushMenu(!showBrushMenu);
            } else {
              onSelectTool('brush');
            }
          }}
          title="Pincel / Caneta (B) - Clique novamente para mudar a textura"
          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all relative ${
            activeTool === 'brush'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
              : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
          }`}
        >
          <Paintbrush className="w-5 h-5" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 absolute bottom-1 right-1" />
        </button>

        {showBrushMenu && (
          <div 
            className="absolute left-14 top-0 w-64 bg-neutral-900 border border-neutral-700 rounded-xl p-2 shadow-2xl z-50 text-xs space-y-1"
            onMouseLeave={() => setShowBrushMenu(false)}
          >
            <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 mb-1">
              Texturas & Tipos de Pincel
            </div>
            {brushPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onSelectBrushPreset(preset.id);
                  onSelectTool('brush');
                  setShowBrushMenu(false);
                }}
                className={`w-full text-left p-2 rounded-lg transition-colors flex flex-col ${
                  brushPreset === preset.id && activeTool === 'brush'
                    ? 'bg-red-600/20 text-red-300 border border-red-500/40'
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <span className="font-semibold text-xs">{preset.name}</span>
                <span className="text-[10px] text-neutral-400">{preset.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Eraser Tool */}
      <button
        onClick={() => onSelectTool('eraser')}
        title="Borracha (E)"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'eraser'
            ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
        }`}
      >
        <Eraser className="w-5 h-5" />
      </button>

      {/* 3. Smart Paint Bucket Tool */}
      <button
        onClick={() => onSelectTool('bucket')}
        title="Balde de Preenchimento Inteligente (G) - Fecha vãos e expande sob a linha"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
          activeTool === 'bucket'
            ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
        }`}
      >
        <PaintBucket className="w-5 h-5" />
      </button>

      {/* 4. Freehand Lasso Selection Tool */}
      <button
        onClick={() => onSelectTool('lasso')}
        title="Laço de Seleção Livre (L) - Desenhe ao redor para mover, girar e duplicar"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'lasso'
            ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
        }`}
      >
        <Lasso className="w-5 h-5" />
      </button>

      {/* 5. Magic Wand Tool */}
      <button
        onClick={() => onSelectTool('magic-wand')}
        title="Varinha Mágica (W) - Seleção automática por cor"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'magic-wand'
            ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
        }`}
      >
        <Wand2 className="w-5 h-5" />
      </button>

      {/* 6. Skeletal Bone Tool */}
      <button
        onClick={() => onSelectTool('bone')}
        title="Ossos & Rigging (Articulações para mover e posar personagens)"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'bone'
            ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-950/50'
            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
        }`}
      >
        <GitCommit className="w-5 h-5" />
      </button>

      {/* 7. 3D Camera Tool */}
      <button
        onClick={() => {
          onToggleCamera3D();
        }}
        title="Câmera 3D & Parallax Multiplano (C)"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          camera3DActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50 ring-2 ring-blue-400/30'
            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
        }`}
      >
        <Camera className="w-5 h-5" />
      </button>

      {/* 8. Shapes & Ruler Tool */}
      <div className="relative">
        <button
          onClick={() => {
            if (activeTool === 'shape') {
              setShowShapeMenu(!showShapeMenu);
            } else {
              onSelectTool('shape');
            }
          }}
          title="Régua e Formas Geométricas (U)"
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
            activeTool === 'shape'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
              : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
          }`}
        >
          <Shapes className="w-5 h-5" />
        </button>

        {showShapeMenu && (
          <div 
            className="absolute left-14 top-0 w-48 bg-neutral-900 border border-neutral-700 rounded-xl p-2 shadow-2xl z-50 text-xs space-y-1"
            onMouseLeave={() => setShowShapeMenu(false)}
          >
            <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-800 mb-1">
              Formas Geométricas
            </div>
            {shapesList.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectShape(s.id);
                  onSelectTool('shape');
                  setShowShapeMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                  activeShape === s.id && activeTool === 'shape'
                    ? 'bg-red-600/20 text-red-300 border border-red-500/40'
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 9. Text Stamp Tool */}
      <button
        onClick={() => onSelectTool('text')}
        title="Carimbo de Texto (T)"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'text'
            ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
        }`}
      >
        <Type className="w-5 h-5" />
      </button>

      {/* 10. Eyedropper Tool */}
      <button
        onClick={() => onSelectTool('eyedropper')}
        title="Conta-gotas (I)"
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
          activeTool === 'eyedropper'
            ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
            : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
        }`}
      >
        <Pipette className="w-5 h-5" />
      </button>

      <div className="w-8 h-px bg-neutral-800 my-1" />

      {/* Current Color Indicator & Swatches popup */}
      <div className="relative mt-auto mb-1">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Cor Atual / Paleta"
          className="w-10 h-10 rounded-full border-2 border-neutral-700 shadow-md transition-transform hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: brushColor }}
        >
          {brushColor.toLowerCase() === '#ffffff' && (
            <div className="w-full h-full border border-neutral-400 rounded-full" />
          )}
        </button>

        {showColorPicker && (
          <div 
            className="absolute left-14 bottom-0 w-52 bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-2xl z-50 text-xs space-y-3"
            onMouseLeave={() => setShowColorPicker(false)}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <span className="font-semibold text-neutral-200">Paleta de Cores</span>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => onSelectColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {quickColors.map((hex) => (
                <button
                  key={hex}
                  onClick={() => {
                    onSelectColor(hex);
                    setShowColorPicker(false);
                  }}
                  className={`w-8 h-8 rounded-lg border transition-transform hover:scale-110 active:scale-95 ${
                    brushColor.toLowerCase() === hex.toLowerCase() ? 'ring-2 ring-red-500 border-white' : 'border-neutral-700'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>

            <div className="pt-1 flex items-center gap-1.5">
              <span className="text-neutral-400 font-mono text-[11px]">HEX:</span>
              <input
                type="text"
                value={brushColor}
                onChange={(e) => onSelectColor(e.target.value)}
                className="bg-neutral-800 text-neutral-100 font-mono text-[11px] px-2 py-0.5 rounded border border-neutral-700 outline-none w-full"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
