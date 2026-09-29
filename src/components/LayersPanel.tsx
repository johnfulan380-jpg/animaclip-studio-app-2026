import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  X,
  Edit2,
  Eraser,
  Compass,
  Search
} from 'lucide-react';
import { Layer } from '../types/animation';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onUpdateOpacity: (layerId: string, opacity: number) => void;
  onUpdateBlendMode: (layerId: string, blendMode: GlobalCompositeOperation) => void;
  onUpdateDepthZ?: (layerId: string, depthZ: number) => void;
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  onRenameLayer: (layerId: string, newName: string) => void;
  onClearActiveLayer: () => void;
  onClose: () => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onToggleVisibility,
  onToggleLock,
  onUpdateOpacity,
  onUpdateBlendMode,
  onUpdateDepthZ,
  onReorderLayer,
  onRenameLayer,
  onClearActiveLayer,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDepthControls, setShowDepthControls] = useState(false);

  const activeLayer = layers.find((l) => l.id === activeLayerId) || layers[0];

  const handleStartRename = (layer: Layer) => {
    setEditingId(layer.id);
    setTempName(layer.name);
  };

  const handleSaveRename = (layerId: string) => {
    if (tempName.trim()) {
      onRenameLayer(layerId, tempName.trim());
    }
    setEditingId(null);
  };

  // Filtered layers (top to bottom order)
  const displayLayers = [...layers]
    .reverse()
    .filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="absolute right-4 top-14 w-80 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden text-neutral-200 select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-500" />
          <span className="font-display font-bold text-sm text-neutral-100">Camadas Ilimitadas</span>
          <span className="text-[11px] text-emerald-400 font-mono font-semibold">({layers.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddLayer}
            title="Adicionar Nova Camada (Ilimitada)"
            className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1 text-xs font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Layer Search (if > 4 layers) */}
      {layers.length > 4 && (
        <div className="px-3 py-1.5 bg-neutral-950/40 border-b border-neutral-800 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar camadas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-neutral-200 placeholder-neutral-500 outline-none w-full"
          />
        </div>
      )}

      {/* Active Layer Quick Properties */}
      {activeLayer && (
        <div className="px-4 py-2.5 bg-neutral-950/60 border-b border-neutral-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">Opacidade ({activeLayer.name}):</span>
            <span className="font-mono text-neutral-200 tabular-nums font-semibold">
              {Math.round(activeLayer.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={activeLayer.opacity}
            onChange={(e) => onUpdateOpacity(activeLayer.id, parseFloat(e.target.value))}
            className="w-full accent-red-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-neutral-400">Modo de Mesclagem:</span>
            <select
              value={activeLayer.blendMode}
              onChange={(e) => onUpdateBlendMode(activeLayer.id, e.target.value as GlobalCompositeOperation)}
              className="bg-neutral-800 text-neutral-200 text-xs px-2 py-1 rounded border border-neutral-700 outline-none"
            >
              <option value="source-over">Normal</option>
              <option value="multiply">Multiplicar (Multiply)</option>
              <option value="screen">Tela (Screen)</option>
              <option value="overlay">Sobrepor (Overlay)</option>
              <option value="darken">Escurecer</option>
              <option value="lighten">Clarear</option>
            </select>
          </div>

          {/* 3D Depth (Z-space parallax for 3D Camera) */}
          <div className="pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <span className="flex items-center gap-1 text-[11px]">
                <Compass className="w-3 h-3 text-blue-400" />
                <span>Profundidade 3D (Câmera Z):</span>
              </span>
              <span className="font-mono text-blue-300 font-semibold tabular-nums text-[11px]">
                {(activeLayer.depthZ || 0) > 0 ? `+${activeLayer.depthZ || 0}` : `${activeLayer.depthZ || 0}`}px
              </span>
            </div>
            <input
              type="range"
              min="-600"
              max="400"
              step="25"
              value={activeLayer.depthZ || 0}
              onChange={(e) => onUpdateDepthZ && onUpdateDepthZ(activeLayer.id, parseInt(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-neutral-500 font-mono mt-0.5">
              <span>Fundo (-600)</span>
              <span>Plano Médio (0)</span>
              <span>Frente (+400)</span>
            </div>
          </div>
        </div>
      )}

      {/* Unlimited Layer List */}
      <div className="max-h-72 overflow-y-auto p-2 space-y-1.5">
        {displayLayers.map((layer) => {
          const isCurrent = layer.id === activeLayerId;
          const originalIndex = layers.findIndex((l) => l.id === layer.id);

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-neutral-800 border-red-500/60 shadow-md shadow-red-950/20'
                  : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-800/60 hover:border-neutral-700'
              }`}
            >
              {/* Left: Visibility & Lock */}
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(layer.id);
                  }}
                  title={layer.visible ? 'Ocultar Camada' : 'Exibir Camada'}
                  className={`p-1 rounded transition-colors ${
                    layer.visible ? 'text-neutral-300 hover:text-white' : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(layer.id);
                  }}
                  title={layer.locked ? 'Desbloquear Camada' : 'Bloquear Camada'}
                  className={`p-1 rounded transition-colors ${
                    layer.locked ? 'text-amber-400' : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Center: Layer Name & Depth badge */}
              <div className="flex-1 min-w-0">
                {editingId === layer.id ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => handleSaveRename(layer.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(layer.id)}
                    autoFocus
                    className="bg-neutral-700 text-white text-xs px-1.5 py-0.5 rounded outline-none w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span
                      onDoubleClick={() => handleStartRename(layer)}
                      className={`block text-xs font-medium truncate ${
                        isCurrent ? 'text-white font-semibold' : 'text-neutral-300'
                      }`}
                    >
                      {layer.name}
                    </span>
                    {(layer.depthZ || 0) !== 0 && (
                      <span className="text-[9px] font-mono px-1 rounded bg-blue-950/80 text-blue-400 border border-blue-800/40">
                        Z:{layer.depthZ}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-0.5 ml-2">
                <button
                  disabled={originalIndex === layers.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'up');
                  }}
                  title="Mover para Cima"
                  className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>

                <button
                  disabled={originalIndex === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReorderLayer(layer.id, 'down');
                  }}
                  title="Mover para Baixo"
                  className="p-1 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateLayer(layer.id);
                  }}
                  title="Duplicar Camada"
                  className="p-1 text-neutral-400 hover:text-white transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>

                {layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    title="Excluir Camada"
                    className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-neutral-800 bg-neutral-950/40 flex justify-between items-center">
        <button
          onClick={onClearActiveLayer}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Eraser className="w-3 h-3" />
          <span>Limpar Camada</span>
        </button>

        <span className="text-[10px] text-emerald-400/80 font-mono font-medium">Camadas Ilimitadas</span>
      </div>
    </div>
  );
};
