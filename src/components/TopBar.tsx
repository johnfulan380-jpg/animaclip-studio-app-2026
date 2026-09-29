import React, { useState } from 'react';
import { 
  RotateCcw, 
  RotateCw, 
  FlipHorizontal, 
  Download, 
  Layers, 
  Eye, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ZoomIn, 
  ZoomOut, 
  HelpCircle,
  FolderOpen,
  Sliders,
  Smartphone
} from 'lucide-react';
import { OnionSkinConfig } from '../types/animation';

interface TopBarProps {
  projectTitle: string;
  onUpdateTitle: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetZoom: () => void;
  isFlipped: boolean;
  onToggleFlip: () => void;
  onionSkin: OnionSkinConfig;
  onUpdateOnionSkin: (newConfig: Partial<OnionSkinConfig>) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenExport: () => void;
  onOpenProjectModal: () => void;
  onOpenShortcuts: () => void;
  onOpenTransitions: () => void;
  onOpenInstallModal: () => void;
  layersPanelOpen: boolean;
  onToggleLayersPanel: () => void;
  width: number;
  height: number;
  fps: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  projectTitle,
  onUpdateTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onResetZoom,
  isFlipped,
  onToggleFlip,
  onionSkin,
  onUpdateOnionSkin,
  soundEnabled,
  onToggleSound,
  onOpenExport,
  onOpenProjectModal,
  onOpenShortcuts,
  onOpenTransitions,
  onOpenInstallModal,
  layersPanelOpen,
  onToggleLayersPanel,
  width,
  height,
  fps,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectTitle);
  const [showOnionMenu, setShowOnionMenu] = useState(false);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onUpdateTitle(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-2 sm:px-4 flex items-center justify-between select-none z-30 shrink-0 gap-1 sm:gap-2">
      {/* Zone 1: Brand & Project Info */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-md shadow-red-950/40">
            <span className="font-display font-extrabold text-white text-xs sm:text-base tracking-tighter">AC</span>
          </div>
          <span className="font-display font-bold text-neutral-100 text-sm sm:text-lg tracking-tight hidden md:inline">
            AnimaClip
          </span>
        </div>

        {/* Project Title Editor (compact on mobile) */}
        <div className="flex items-center gap-1">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-neutral-800 text-neutral-100 text-xs sm:text-sm font-medium px-2 py-0.5 rounded border border-neutral-700 outline-none focus:border-red-500 w-28 sm:w-44"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(projectTitle);
                setIsEditingTitle(true);
              }}
              title="Clique para renomear"
              className="text-neutral-200 hover:text-white text-xs sm:text-sm font-medium max-w-[100px] sm:max-w-[160px] md:max-w-[220px] truncate px-1.5 py-1 rounded hover:bg-neutral-800 transition-colors text-left"
            >
              {projectTitle}
            </button>
          )}

          <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono tabular-nums">
            <span>{width}×{height}</span>
            <span className="text-neutral-600">·</span>
            <span>{fps} FPS</span>
          </span>
        </div>
      </div>

      {/* Zone 2: Essential Canvas Navigation (Undo, Redo, Onion, Layers) */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-800/80 rounded-lg p-0.5 border border-neutral-700/60">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className={`p-1.5 rounded transition-colors ${
              canUndo ? 'text-neutral-300 hover:text-white hover:bg-neutral-700' : 'text-neutral-600 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className={`p-1.5 rounded transition-colors ${
              canRedo ? 'text-neutral-300 hover:text-white hover:bg-neutral-700' : 'text-neutral-600 cursor-not-allowed'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Zoom Controls (hidden on mobile) */}
        <div className="hidden lg:flex items-center bg-neutral-800/80 rounded-lg p-0.5 border border-neutral-700/60">
          <button
            onClick={() => onZoomChange(Math.max(0.25, zoom - 0.15))}
            title="Diminuir Zoom"
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            title="Ajustar Zoom à Tela (100%)"
            className="px-2 text-xs font-mono font-medium text-neutral-300 hover:text-white tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => onZoomChange(Math.min(4, zoom + 0.15))}
            title="Aumentar Zoom"
            className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Flip Horizontal (desktop only) */}
        <button
          onClick={onToggleFlip}
          title="Espelhar Tela Horizontalmente"
          className={`p-1.5 rounded-lg border transition-colors hidden sm:block ${
            isFlipped 
              ? 'bg-red-500/20 text-red-400 border-red-500/40' 
              : 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60 hover:bg-neutral-700'
          }`}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        {/* Onion Skin Dropdown & Toggle */}
        <div className="relative">
          <div className="flex items-center bg-neutral-800/80 rounded-lg border border-neutral-700/60 overflow-hidden">
            <button
              onClick={() => onUpdateOnionSkin({ enabled: !onionSkin.enabled })}
              title="Alternar Papel Vegetal / Onion Skin (O)"
              className={`flex items-center gap-1 px-2 py-1.5 text-xs font-semibold transition-colors ${
                onionSkin.enabled 
                  ? 'bg-amber-500/20 text-amber-300' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Onion</span>
            </button>
            <button
              onClick={() => setShowOnionMenu(!showOnionMenu)}
              title="Configurações do Papel Vegetal"
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 border-l border-neutral-700/60 transition-colors hidden sm:block"
            >
              <Sliders className="w-3 h-3" />
            </button>
          </div>

          {/* Onion Skin Settings Popup */}
          {showOnionMenu && (
            <div className="absolute right-0 top-12 w-64 bg-neutral-900 border border-neutral-700 rounded-xl p-3.5 shadow-2xl z-50 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="font-semibold text-neutral-200">Papel Vegetal (Onion Skin)</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${onionSkin.enabled ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-800 text-neutral-400'}`}>
                  {onionSkin.enabled ? 'ATIVO' : 'DESATIVADO'}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Quadros Anteriores:</span>
                  <span className="text-neutral-200 font-mono">{onionSkin.prevFrames}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      onClick={() => onUpdateOnionSkin({ prevFrames: num })}
                      className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                        onionSkin.prevFrames === num ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Quadros Seguintes:</span>
                  <span className="text-neutral-200 font-mono">{onionSkin.nextFrames}</span>
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2].map((num) => (
                    <button
                      key={num}
                      onClick={() => onUpdateOnionSkin({ nextFrames: num })}
                      className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                        onionSkin.nextFrames === num ? 'bg-green-500/30 text-green-300 border border-green-500/50' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {num === 0 ? 'Off' : `${num}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Opacidade:</span>
                  <span className="text-neutral-200 font-mono">{Math.round(onionSkin.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={onionSkin.opacity}
                  onChange={(e) => onUpdateOnionSkin({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-1 flex items-center justify-between border-t border-neutral-800">
                <label className="text-neutral-300 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onionSkin.coloredTint}
                    onChange={(e) => onUpdateOnionSkin({ coloredTint: e.target.checked })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Tintas Vermelho/Verde</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Transition Effects Library Button (desktop only) */}
        <button
          onClick={onOpenTransitions}
          title="Biblioteca de Transições Entre Quadros"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Transições</span>
        </button>

        {/* Sound FX Toggle (desktop only) */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Efeitos Sonoros Ativados' : 'Efeitos Sonoros Mudos'}
          className={`p-1.5 rounded-lg border transition-colors hidden sm:block ${
            soundEnabled 
              ? 'bg-neutral-800/80 text-amber-400 border-neutral-700/60 hover:bg-neutral-700' 
              : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 hover:bg-neutral-700'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Toggle Layers Panel */}
        <button
          onClick={onToggleLayersPanel}
          title="Alternar Painel de Camadas (L)"
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-colors text-xs font-semibold ${
            layersPanelOpen
              ? 'bg-red-600/20 text-red-400 border-red-500/40'
              : 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60 hover:bg-neutral-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Camadas</span>
        </button>
      </div>

      {/* Zone 3: Install App & Export Actions */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <button
          onClick={onOpenProjectModal}
          title="Novo Projeto / Projetos Exemplo"
          className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-neutral-300 hover:text-white transition-colors hidden sm:block"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        {/* Prominent Install App Button (Visible on ALL devices including mobile!) */}
        <button
          onClick={onOpenInstallModal}
          title="Baixar e Instalar AnimaClip Studio no Celular ou PC"
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 text-amber-300 border border-amber-500/50 transition-all text-xs font-bold shadow-md shadow-amber-950/30 animate-pulse"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>Baixar App</span>
        </button>

        <button
          onClick={onOpenShortcuts}
          title="Atalhos do Teclado (?)"
          className="p-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-neutral-300 hover:text-white transition-colors hidden lg:block"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Primary Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-950/50 hover:shadow-red-900/60 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </header>
  );
};
