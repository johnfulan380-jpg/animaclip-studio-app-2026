import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Trash2, 
  Play, 
  Sliders, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { Frame, FrameTransition, TransitionType } from '../types/animation';
import { renderTransitionFrame } from '../utils/transitionRenderer';

interface TransitionModalProps {
  frameIndex: number;
  currentTransition?: FrameTransition;
  frameAThumbnail?: string;
  frameBThumbnail?: string;
  fps: number;
  onSaveTransition: (transition: FrameTransition) => void;
  onRemoveTransition: () => void;
  onClose: () => void;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({
  frameIndex,
  currentTransition,
  frameAThumbnail,
  frameBThumbnail,
  fps,
  onSaveTransition,
  onRemoveTransition,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<TransitionType>(currentTransition?.type || 'crossfade');
  const [durationFrames, setDurationFrames] = useState<number>(currentTransition?.durationFrames || 4);
  const [easing, setEasing] = useState<FrameTransition['easing']>(currentTransition?.easing || 'ease-in-out');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const transitionList: { type: TransitionType; name: string; desc: string }[] = [
    { type: 'crossfade', name: 'Dissolver (Crossfade)', desc: 'Mistura suave entre os quadros' },
    { type: 'fade-black', name: 'Fade para Preto', desc: 'Escurece a tela e clareia para o próximo' },
    { type: 'fade-white', name: 'Flash Branco', desc: 'Clarão cinematográfico' },
    { type: 'slide-left', name: 'Deslizar para Esquerda', desc: 'Próximo quadro entra da direita' },
    { type: 'slide-right', name: 'Deslizar para Direita', desc: 'Próximo quadro entra da esquerda' },
    { type: 'slide-up', name: 'Deslizar para Cima', desc: 'Movimento vertical ascendente' },
    { type: 'slide-down', name: 'Deslizar para Baixo', desc: 'Movimento vertical descendente' },
    { type: 'zoom-in', name: 'Zoom In (Aproximar)', desc: 'Aproximação dinâmica com escala' },
    { type: 'zoom-out', name: 'Zoom Out (Afastar)', desc: 'Recuo da câmera revelando o quadro' },
    { type: 'wipe-horizontal', name: 'Cortina Linear (Wipe)', desc: 'Varredura horizontal de cena' },
    { type: 'wipe-circle', name: 'Íris Circular (Cartoon)', desc: 'Círculo clássico de desenho animado' },
  ];

  // Live animated preview of the transition
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const imgA = new Image();
    const imgB = new Image();
    let loadedCount = 0;

    const canvasA = document.createElement('canvas');
    canvasA.width = 320;
    canvasA.height = 180;
    const ctxA = canvasA.getContext('2d')!;

    const canvasB = document.createElement('canvas');
    canvasB.width = 320;
    canvasB.height = 180;
    const ctxB = canvasB.getContext('2d')!;

    const onLoaded = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        ctxA.fillStyle = '#1e293b';
        ctxA.fillRect(0, 0, 320, 180);
        ctxA.drawImage(imgA, 0, 0, 320, 180);

        ctxB.fillStyle = '#0f172a';
        ctxB.fillRect(0, 0, 320, 180);
        ctxB.drawImage(imgB, 0, 0, 320, 180);

        startLoop();
      }
    };

    if (frameAThumbnail) {
      imgA.onload = onLoaded;
      imgA.src = frameAThumbnail;
    } else {
      // Fallback graphic for A
      ctxA.fillStyle = '#3b82f6';
      ctxA.fillRect(0, 0, 320, 180);
      ctxA.fillStyle = '#ffffff';
      ctxA.font = 'bold 24px sans-serif';
      ctxA.fillText(`Quadro ${frameIndex + 1}`, 100, 100);
      loadedCount++;
    }

    if (frameBThumbnail) {
      imgB.onload = onLoaded;
      imgB.src = frameBThumbnail;
    } else {
      // Fallback graphic for B
      ctxB.fillStyle = '#ef4444';
      ctxB.fillRect(0, 0, 320, 180);
      ctxB.fillStyle = '#ffffff';
      ctxB.font = 'bold 24px sans-serif';
      ctxB.fillText(`Quadro ${frameIndex + 2}`, 100, 100);
      loadedCount++;
    }

    let startTime = Date.now();
    const totalCycleMs = (durationFrames / fps) * 1000 + 1000;

    const startLoop = () => {
      const loop = () => {
        const elapsed = (Date.now() - startTime) % totalCycleMs;
        const transDurationMs = (durationFrames / fps) * 1000;
        let progress = 1;

        if (elapsed < transDurationMs) {
          progress = elapsed / transDurationMs;
        } else if (elapsed > totalCycleMs - 400) {
          // Pause at end then loop
          progress = 1;
        } else {
          progress = 1;
        }

        renderTransitionFrame(ctx, canvasA, canvasB, selectedType, progress, easing, '#0f172a');
        animFrameIdRef.current = requestAnimationFrame(loop);
      };
      loop();
    };

    if (loadedCount >= 2) {
      startLoop();
    }

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [selectedType, durationFrames, easing, frameAThumbnail, frameBThumbnail, frameIndex, fps]);

  const handleSave = () => {
    onSaveTransition({
      type: selectedType,
      durationFrames,
      easing,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-neutral-100">
                Efeito de Transição (Quadro #{frameIndex + 1} → #{frameIndex + 2})
              </h3>
              <p className="text-xs text-neutral-400">
                Transições pré-definidas para transição suave de cena
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Grid with Preview & Presets */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto max-h-[70vh]">
          {/* Left Column: Interactive Live Preview & Duration Slider */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Pré-visualização em Tempo Real:
              </span>
              <div className="w-full aspect-video bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center relative shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={320}
                  height={180}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Duration Slider */}
            <div className="bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-300 font-medium">Duração da Transição:</span>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {durationFrames} quadros ({(durationFrames / fps).toFixed(2)}s)
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={durationFrames}
                onChange={(e) => setDurationFrames(parseInt(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                <span>Rápida (2f)</span>
                <span>Normal (4-6f)</span>
                <span>Lenta (12f+)</span>
              </div>
            </div>

            {/* Easing */}
            <div>
              <span className="text-xs font-semibold text-neutral-300 block mb-1">
                Suavização (Easing):
              </span>
              <select
                value={easing}
                onChange={(e) => setEasing(e.target.value as any)}
                className="w-full bg-neutral-800 text-neutral-200 text-xs px-3 py-2 rounded-xl border border-neutral-700 outline-none"
              >
                <option value="ease-in-out">Ease In-Out (Acelera e desacelera suave)</option>
                <option value="ease-out">Ease Out (Desacelera no final)</option>
                <option value="ease-in">Ease In (Começa lento e acelera)</option>
                <option value="linear">Linear (Velocidade constante)</option>
              </select>
            </div>
          </div>

          {/* Right Column: Library of Transition Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-neutral-300 block">
              Escolha o Tipo de Transição:
            </span>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {transitionList.map((t) => {
                const isSelected = selectedType === t.type;
                return (
                  <button
                    key={t.type}
                    onClick={() => setSelectedType(t.type)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-md shadow-amber-950/20'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{t.name}</div>
                      <div className="text-[11px] text-neutral-400">{t.desc}</div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div>
            {currentTransition && currentTransition.type !== 'none' && (
              <button
                onClick={() => {
                  onRemoveTransition();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover Transição</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-950/40"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Transição</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
