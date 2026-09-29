import React, { useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Plus, 
  Copy, 
  Trash2, 
  Repeat, 
  Clock, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Clipboard,
  Sliders
} from 'lucide-react';
import { Frame, LoopMode, FrameTransition } from '../types/animation';

interface TimelineProps {
  frames: Frame[];
  currentFrameIndex: number;
  onSelectFrame: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  loopMode: LoopMode;
  onToggleLoopMode: () => void;
  fps: number;
  onChangeFps: (fps: number) => void;
  onAddFrame: (insertAfterCurrent?: boolean) => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  onCopyFrame: (index: number) => void;
  onPasteFrame: (index: number) => void;
  hasCopiedFrame: boolean;
  onUpdateFrameHold: (index: number, hold: number) => void;
  onOpenTransitionModal: (frameIndex: number) => void;
  onReorderFrame: (fromIndex: number, toIndex: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  frames,
  currentFrameIndex,
  onSelectFrame,
  isPlaying,
  onTogglePlay,
  loopMode,
  onToggleLoopMode,
  fps,
  onChangeFps,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onCopyFrame,
  onPasteFrame,
  hasCopiedFrame,
  onUpdateFrameHold,
  onOpenTransitionModal,
  onReorderFrame,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll timeline to keep current frame visible
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.children[currentFrameIndex] as HTMLElement;
      if (activeEl) {
        const container = scrollContainerRef.current;
        const scrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
    }
  }, [currentFrameIndex]);

  // Calculate elapsed time code
  const currentFrame = frames[currentFrameIndex] || frames[0];
  const timeSeconds = (currentFrameIndex / fps).toFixed(2);

  const getTransitionLabel = (trans?: FrameTransition) => {
    if (!trans || trans.type === 'none') return null;
    switch (trans.type) {
      case 'crossfade': return 'Fade';
      case 'fade-black': return 'Black';
      case 'fade-white': return 'Flash';
      case 'slide-left': return 'Slide L';
      case 'slide-right': return 'Slide R';
      case 'slide-up': return 'Slide U';
      case 'slide-down': return 'Slide D';
      case 'zoom-in': return 'Zoom +';
      case 'zoom-out': return 'Zoom -';
      case 'wipe-horizontal': return 'Wipe';
      case 'wipe-circle': return 'Iris';
      default: return 'Trans';
    }
  };

  return (
    <div className="h-32 bg-neutral-900 border-t border-neutral-800 flex flex-col select-none shrink-0 z-20">
      {/* Top Controls Bar */}
      <div className="h-10 px-4 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-300">
        {/* Left: Playback controls */}
        <div className="flex items-center gap-2">
          {/* Previous Frame */}
          <button
            onClick={() => onSelectFrame(Math.max(0, currentFrameIndex - 1))}
            disabled={isPlaying || currentFrameIndex === 0}
            title="Quadro Anterior (,)"
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Big Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            title="Reproduzir / Pausar (Espaço)"
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-950/40'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span className="text-xs">{isPlaying ? 'Pausar' : 'Play'}</span>
          </button>

          {/* Next Frame */}
          <button
            onClick={() => onSelectFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
            disabled={isPlaying || currentFrameIndex === frames.length - 1}
            title="Próximo Quadro (.)"
            className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Loop Mode */}
          <button
            onClick={onToggleLoopMode}
            title={`Modo de Repetição: ${
              loopMode === 'loop' ? 'Repetir em Loop' : loopMode === 'ping-pong' ? 'Ping-Pong (Ir e Voltar)' : 'Uma vez'
            }`}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
          >
            <Repeat className="w-3.5 h-3.5 text-neutral-400" />
            <span className="capitalize hidden sm:inline">{loopMode}</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          {/* Frame Counter & Time */}
          <div className="flex items-center gap-2 font-mono tabular-nums text-xs font-semibold text-neutral-300">
            <span className="text-red-400">
              {String(currentFrameIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">{String(frames.length).padStart(2, '0')}</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400 text-[11px]">{timeSeconds}s</span>
          </div>
        </div>

        {/* Center: Frame Duration Adjustment (Hold frames) */}
        <div className="hidden md:flex items-center gap-2 bg-neutral-800/60 px-2 py-0.5 rounded-lg border border-neutral-700/50">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-neutral-400 text-[11px]">Duração do Quadro:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((hold) => (
              <button
                key={hold}
                onClick={() => onUpdateFrameHold(currentFrameIndex, hold)}
                title={`Segurar por ${hold} ${hold === 1 ? 'quadro' : 'quadros'} (animação ${hold === 2 ? 'em 2s' : 'em ' + hold})`}
                className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold transition-colors ${
                  (currentFrame?.holdFrames || 1) === hold
                    ? 'bg-red-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {hold}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: FPS Selector & Quick Frame Actions */}
        <div className="flex items-center gap-2">
          {/* FPS Selector */}
          <div className="flex items-center gap-1.5 bg-neutral-800/80 px-2 py-1 rounded-lg border border-neutral-700/50">
            <span className="text-neutral-400 text-[11px]">FPS:</span>
            <select
              value={fps}
              onChange={(e) => onChangeFps(parseInt(e.target.value))}
              className="bg-transparent text-neutral-200 font-mono text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="6" className="bg-neutral-800">6 fps</option>
              <option value="8" className="bg-neutral-800">8 fps</option>
              <option value="12" className="bg-neutral-800">12 fps (Padrão 2D)</option>
              <option value="16" className="bg-neutral-800">16 fps</option>
              <option value="24" className="bg-neutral-800">24 fps (Cinema/Anime)</option>
              <option value="30" className="bg-neutral-800">30 fps</option>
            </select>
          </div>

          <div className="h-4 w-px bg-neutral-800 mx-0.5" />

          {/* Copy Frame */}
          <button
            onClick={() => onCopyFrame(currentFrameIndex)}
            title="Copiar Quadro (Ctrl+C)"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Paste Frame */}
          {hasCopiedFrame && (
            <button
              onClick={() => onPasteFrame(currentFrameIndex)}
              title="Colar Quadro (Ctrl+V)"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 hover:text-white transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate Frame */}
          <button
            onClick={() => onDuplicateFrame(currentFrameIndex)}
            title="Duplicar Quadro Atual (D) - Copia todas as camadas para novo quadro"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors text-xs font-medium"
          >
            <Copy className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Duplicar</span>
          </button>

          {/* Delete Frame */}
          {frames.length > 1 && (
            <button
              onClick={() => onDeleteFrame(currentFrameIndex)}
              title="Excluir Quadro Atual"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-900/50 text-neutral-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Add Frame */}
          <button
            onClick={() => onAddFrame(true)}
            title="Adicionar Novo Quadro em Branco (N)"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors text-xs font-bold shadow-md shadow-red-950/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quadro</span>
          </button>
        </div>
      </div>

      {/* Frame Strip (Horizontal Thumbnails Track) */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 px-4 py-2 flex items-center gap-2 overflow-x-auto overflow-y-hidden"
      >
        {frames.map((frame, index) => {
          const isSelected = index === currentFrameIndex;
          const transLabel = getTransitionLabel(frame.transition);

          return (
            <React.Fragment key={frame.id}>
              {/* Frame Card */}
              <div
                onClick={() => onSelectFrame(index)}
                className={`group relative shrink-0 w-20 h-16 rounded-xl border-2 cursor-pointer transition-all flex flex-col overflow-hidden bg-neutral-950 ${
                  isSelected
                    ? 'border-red-500 shadow-lg shadow-red-950/50 ring-2 ring-red-500/20 scale-105 z-10'
                    : 'border-neutral-800 hover:border-neutral-700 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Frame Thumbnail */}
                <div className="flex-1 w-full relative bg-canvas-checkered-dark flex items-center justify-center overflow-hidden">
                  {frame.thumbnail ? (
                    <img 
                      src={frame.thumbnail} 
                      alt={`Quadro ${index + 1}`} 
                      className="w-full h-full object-contain pointer-events-none" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600 font-mono">
                      Vazio
                    </div>
                  )}

                  {/* Hold frame duration indicator */}
                  {(frame.holdFrames || 1) > 1 && (
                    <div className="absolute top-1 right-1 bg-amber-500/90 text-neutral-950 px-1 py-0.2 rounded font-mono text-[9px] font-bold">
                      {frame.holdFrames}x
                    </div>
                  )}
                </div>

                {/* Frame Index Bar */}
                <div className={`h-4.5 px-1.5 flex items-center justify-between text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  <span>#{index + 1}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
              </div>

              {/* Transition Node Between Frames */}
              {index < frames.length - 1 && (
                <button
                  onClick={() => onOpenTransitionModal(index)}
                  title={
                    frame.transition && frame.transition.type !== 'none'
                      ? `Transição: ${frame.transition.type} (${frame.transition.durationFrames} quadros) - Clique para editar`
                      : 'Adicionar Efeito de Transição (Fade, Slide, Zoom, Wipe)'
                  }
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    frame.transition && frame.transition.type !== 'none'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-neutral-800/60 text-neutral-500 border border-neutral-700/40 hover:bg-neutral-700 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                </button>
              )}
            </React.Fragment>
          );
        })}

        {/* Quick Add Frame Button at the end */}
        <button
          onClick={() => onAddFrame(false)}
          title="Adicionar Quadro no Final"
          className="shrink-0 w-16 h-16 rounded-xl border border-dashed border-neutral-700 hover:border-red-500 text-neutral-500 hover:text-red-400 bg-neutral-950/40 hover:bg-neutral-900/60 transition-colors flex flex-col items-center justify-center gap-1"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-medium">+ Fim</span>
        </button>
      </div>
    </div>
  );
};
