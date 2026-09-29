import React from 'react';
import { 
  BrushDynamics, 
  ToolType, 
  SmartFillSettings, 
  MagicWandSettings, 
  SelectionState,
  ShapeType
} from '../types/animation';
import { 
  Sliders, 
  Sparkles, 
  Copy, 
  Trash2, 
  Check, 
  X, 
  FlipHorizontal2, 
  FlipVertical2, 
  Layers,
  ShieldCheck,
  Maximize
} from 'lucide-react';

interface ToolPropertiesPanelProps {
  activeTool: ToolType;
  brush: BrushDynamics;
  onUpdateBrush: (newBrush: Partial<BrushDynamics>) => void;
  smartFill: SmartFillSettings;
  onUpdateSmartFill: (newFill: Partial<SmartFillSettings>) => void;
  magicWand: MagicWandSettings;
  onUpdateMagicWand: (newWand: Partial<MagicWandSettings>) => void;
  selection: SelectionState | null;
  onCommitSelection: () => void;
  onDuplicateSelectionToNextFrame: () => void;
  onDeleteSelection: () => void;
  onCancelSelection: () => void;
  onFlipSelectionH: () => void;
  onFlipSelectionV: () => void;
  activeShape: ShapeType;
  onSelectShape: (shape: ShapeType) => void;
}

export const ToolPropertiesPanel: React.FC<ToolPropertiesPanelProps> = ({
  activeTool,
  brush,
  onUpdateBrush,
  smartFill,
  onUpdateSmartFill,
  magicWand,
  onUpdateMagicWand,
  selection,
  onCommitSelection,
  onDuplicateSelectionToNextFrame,
  onDeleteSelection,
  onCancelSelection,
  onFlipSelectionH,
  onFlipSelectionV,
  activeShape,
  onSelectShape,
}) => {
  // If selection is currently active, show transform action toolbar
  if (selection && selection.isActive) {
    return (
      <div className="h-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 flex items-center justify-between z-10 shrink-0 text-xs text-neutral-200">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-red-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {selection.type === 'lasso' ? 'Laço Ativo' : 'Varinha Mágica Ativa'}
          </span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-400 hidden sm:inline">
            Arraste para mover · Cantos para redimensionar · Topo para girar
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onFlipSelectionH}
            title="Espelhar Horizontalmente"
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            <FlipHorizontal2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFlipSelectionV}
            title="Espelhar Verticalmente"
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          >
            <FlipVertical2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onDuplicateSelectionToNextFrame}
            title="Copiar e Colar no Próximo Quadro (Excelente para in-betweening!)"
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Duplicar para Próximo Quadro</span>
          </button>

          <button
            onClick={onDeleteSelection}
            title="Excluir Conteúdo da Seleção (Delete)"
            className="p-1.5 rounded hover:bg-red-900/50 text-neutral-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            onClick={onCancelSelection}
            title="Cancelar / Desmarcar"
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={onCommitSelection}
            title="Fixar / Carimbar na Camada (Enter)"
            className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-all shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Fixar</span>
          </button>
        </div>
      </div>
    );
  }

  // Brush / Eraser Properties
  if (activeTool === 'brush' || activeTool === 'eraser') {
    const isEraser = activeTool === 'eraser';
    return (
      <div className="h-10 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 px-4 flex items-center gap-4 z-10 shrink-0 text-xs text-neutral-300 overflow-x-auto">
        {/* Brush Size */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <span className="text-neutral-400 font-medium">Tamanho:</span>
          <input
            type="range"
            min="1"
            max={isEraser ? "150" : "100"}
            value={brush.size}
            onChange={(e) => onUpdateBrush({ size: parseInt(e.target.value) })}
            className="w-20 accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-neutral-200 tabular-nums w-8 text-right">{brush.size}px</span>
        </div>

        <div className="h-4 w-px bg-neutral-800 shrink-0" />

        {/* Brush Opacity */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <span className="text-neutral-400 font-medium">Opacidade:</span>
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={brush.opacity}
            onChange={(e) => onUpdateBrush({ opacity: parseFloat(e.target.value) })}
            className="w-20 accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-neutral-200 tabular-nums w-8 text-right">{Math.round(brush.opacity * 100)}%</span>
        </div>

        <div className="h-4 w-px bg-neutral-800 shrink-0" />

        {/* Stabilizer (Streamline) */}
        {!isEraser && (
          <>
            <div className="flex items-center gap-2 min-w-[160px]">
              <span className="text-neutral-400 font-medium">Estabilizador:</span>
              <input
                type="range"
                min="0"
                max="10"
                value={brush.stabilizer}
                onChange={(e) => onUpdateBrush({ stabilizer: parseInt(e.target.value) })}
                className="w-16 accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-neutral-200 tabular-nums">{brush.stabilizer}</span>
            </div>

            <div className="h-4 w-px bg-neutral-800 shrink-0" />

            {/* Velocity/Pressure dynamic toggle */}
            <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer select-none whitespace-nowrap">
              <input
                type="checkbox"
                checked={brush.pressureDynamic}
                onChange={(e) => onUpdateBrush({ pressureDynamic: e.target.checked })}
                className="accent-red-500 rounded"
              />
              <span>Dinâmica de Velocidade</span>
            </label>
          </>
        )}
      </div>
    );
  }

  // Smart Paint Bucket Properties
  if (activeTool === 'bucket') {
    return (
      <div className="h-10 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 px-4 flex items-center gap-5 z-10 shrink-0 text-xs text-neutral-300 overflow-x-auto">
        <span className="font-semibold text-neutral-200 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Preenchimento Inteligente:
        </span>

        {/* Tolerance */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Tolerância:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={smartFill.tolerance}
            onChange={(e) => onUpdateSmartFill({ tolerance: parseInt(e.target.value) })}
            className="w-20 accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-neutral-200 tabular-nums">{smartFill.tolerance}%</span>
        </div>

        <div className="h-4 w-px bg-neutral-800 shrink-0" />

        {/* Expand / Bleed under line */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-400" title="Expande o preenchimento por baixo do contorno para evitar bordas brancas">
            Expansão sob Linha:
          </span>
          <input
            type="range"
            min="0"
            max="4"
            step="1"
            value={smartFill.expandPixels}
            onChange={(e) => onUpdateSmartFill({ expandPixels: parseInt(e.target.value) })}
            className="w-16 accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-neutral-200 tabular-nums">+{smartFill.expandPixels}px</span>
        </div>

        <div className="h-4 w-px bg-neutral-800 shrink-0" />

        {/* Sample All Layers */}
        <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer select-none whitespace-nowrap" title="Detecta os traços de todas as camadas enquanto preenche na camada ativa">
          <input
            type="checkbox"
            checked={smartFill.sampleAllLayers}
            onChange={(e) => onUpdateSmartFill({ sampleAllLayers: e.target.checked })}
            className="accent-red-500 rounded"
          />
          <Layers className="w-3.5 h-3.5 text-neutral-400" />
          <span>Amostrar Todas as Camadas</span>
        </label>
      </div>
    );
  }

  // Magic Wand Properties
  if (activeTool === 'magic-wand') {
    return (
      <div className="h-10 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 px-4 flex items-center gap-5 z-10 shrink-0 text-xs text-neutral-300 overflow-x-auto">
        <span className="font-semibold text-neutral-200">Varinha Mágica:</span>

        {/* Tolerance */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Tolerância:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={magicWand.tolerance}
            onChange={(e) => onUpdateMagicWand({ tolerance: parseInt(e.target.value) })}
            className="w-20 accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-neutral-200 tabular-nums">{magicWand.tolerance}%</span>
        </div>

        <div className="h-4 w-px bg-neutral-800 shrink-0" />

        {/* Contiguous Toggle */}
        <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={magicWand.contiguous}
            onChange={(e) => onUpdateMagicWand({ contiguous: e.target.checked })}
            className="accent-red-500 rounded"
          />
          <span>Apenas Contíguo</span>
        </label>

        <div className="h-4 w-px bg-neutral-800 shrink-0" />

        {/* Sample All Layers */}
        <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer select-none whitespace-nowrap">
          <input
            type="checkbox"
            checked={magicWand.sampleAllLayers}
            onChange={(e) => onUpdateMagicWand({ sampleAllLayers: e.target.checked })}
            className="accent-red-500 rounded"
          />
          <span>Amostrar Todas as Camadas</span>
        </label>
      </div>
    );
  }

  // Shapes Properties
  if (activeTool === 'shape') {
    return (
      <div className="h-10 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 px-4 flex items-center gap-4 z-10 shrink-0 text-xs text-neutral-300 overflow-x-auto">
        <span className="font-semibold text-neutral-200">Forma Ativa:</span>
        <div className="flex gap-1">
          {[
            { id: 'line' as ShapeType, label: 'Linha' },
            { id: 'circle' as ShapeType, label: 'Círculo' },
            { id: 'rectangle' as ShapeType, label: 'Retângulo' },
            { id: 'arrow' as ShapeType, label: 'Seta' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectShape(s.id)}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                activeShape === s.id ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-neutral-800 shrink-0" />

        <div className="flex items-center gap-2">
          <span className="text-neutral-400">Espessura:</span>
          <input
            type="range"
            min="1"
            max="50"
            value={brush.size}
            onChange={(e) => onUpdateBrush({ size: parseInt(e.target.value) })}
            className="w-20 accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-neutral-200 tabular-nums">{brush.size}px</span>
        </div>
      </div>
    );
  }

  // Default empty or minimal bar
  return (
    <div className="h-10 bg-neutral-900/90 backdrop-blur border-b border-neutral-800 px-4 flex items-center justify-between z-10 shrink-0 text-xs text-neutral-400">
      <span>{activeTool === 'lasso' ? 'Desenhe uma curva fechada para selecionar e transformar elementos' : 'Clique na tela para usar a ferramenta'}</span>
    </div>
  );
};
