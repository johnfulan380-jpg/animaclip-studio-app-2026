import React, { useState, useMemo } from 'react';
import { 
  Download, 
  X, 
  Video, 
  Image as ImageIcon, 
  Film, 
  FolderArchive, 
  Check, 
  Sparkles,
  Camera,
  Layers,
  Sliders,
  AlertCircle,
  FileVideo,
  CheckCircle2,
  Info
} from 'lucide-react';
import { AnimationProject, ExportFormat, ExportSettings, ResolutionPreset } from '../types/animation';
import { 
  exportToVideo, 
  exportToGif, 
  exportToZipPngSequence, 
  downloadBlob, 
  ExportProgress,
  isBrowserMp4Supported 
} from '../utils/highResExporter';

interface ExportModalProps {
  project: AnimationProject;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>('mp4');
  const [resolutionId, setResolutionId] = useState<string>('1080p');
  const [customWidth, setCustomWidth] = useState<number>(project.width);
  const [customHeight, setCustomHeight] = useState<number>(project.height);
  const [fps, setFps] = useState<number>(project.fps || 12);
  const [includeBackground, setIncludeBackground] = useState<boolean>(!project.isTransparent);
  const [backgroundColor, setBackgroundColor] = useState<string>(project.backgroundColor || '#ffffff');
  const [renderTransitions, setRenderTransitions] = useState<boolean>(true);
  const [applyCamera3D, setApplyCamera3D] = useState<boolean>(project.camera3D?.enabled || false);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExportProgress>({ percent: 0, statusText: '' });
  const [exportError, setExportError] = useState<string | null>(null);

  const hasNativeMp4 = useMemo(() => isBrowserMp4Supported(), []);

  const resolutionPresets: ResolutionPreset[] = [
    { id: '4k', label: '4K Ultra HD', width: 3840, height: 2160, aspect: '16:9', badge: 'Máxima Nitidez' },
    { id: '1440p', label: '2K QHD', width: 2560, height: 1440, aspect: '16:9', badge: 'Pro' },
    { id: '1080p', label: 'Full HD 1080p', width: 1920, height: 1080, aspect: '16:9', badge: 'Recomendado' },
    { id: '720p', label: 'HD 720p', width: 1280, height: 720, aspect: '16:9' },
    { id: 'square', label: 'Instagram Feed (Quadrado)', width: 1080, height: 1080, aspect: '1:1' },
    { id: 'vertical', label: 'TikTok / Reels (Vertical)', width: 1080, height: 1920, aspect: '9:16' },
    { id: 'custom', label: 'Personalizado', width: customWidth, height: customHeight, aspect: 'Custom' },
  ];

  const currentPreset = resolutionPresets.find((r) => r.id === resolutionId) || resolutionPresets[2];
  const targetWidth = resolutionId === 'custom' ? customWidth : currentPreset.width;
  const targetHeight = resolutionId === 'custom' ? customHeight : currentPreset.height;

  const handleStartExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setProgress({ percent: 5, statusText: 'Inicializando motor de renderização em alta resolução...' });

    const settings: ExportSettings = {
      format,
      resolutionId,
      width: targetWidth,
      height: targetHeight,
      fps,
      includeBackground,
      backgroundColor,
      quality: 0.95,
      loopCount: 2,
      smoothSmoothing: true,
      renderTransitions,
      applyCamera3D,
    };

    try {
      if (format === 'mp4' || format === 'webm') {
        const { blob, formatUsed } = await exportToVideo(project, settings, (p) => setProgress(p));
        const filename = `${project.title.replace(/\s+/g, '_')}_${targetWidth}x${targetHeight}.${formatUsed}`;
        downloadBlob(blob, filename);
      } else if (format === 'gif') {
        const gifBlob = await exportToGif(project, settings, (p) => setProgress(p));
        downloadBlob(gifBlob, `${project.title.replace(/\s+/g, '_')}_${targetWidth}x${targetHeight}.gif`);
      } else if (format === 'zip') {
        const zipBlob = await exportToZipPngSequence(project, settings, (p) => setProgress(p));
        downloadBlob(zipBlob, `${project.title.replace(/\s+/g, '_')}_PNG_Sequence_${targetWidth}x${targetHeight}.zip`);
      } else if (format === 'png-current') {
        const singleCanvas = document.createElement('canvas');
        singleCanvas.width = targetWidth;
        singleCanvas.height = targetHeight;
        const ctx = singleCanvas.getContext('2d')!;
        
        if (includeBackground) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        const curFrame = project.frames[project.currentFrameIndex] || project.frames[0];
        for (const layer of project.layers) {
          if (!layer.visible) continue;
          const url = curFrame.layers[layer.id];
          if (url) {
            const img = new Image();
            await new Promise((res) => {
              img.onload = res;
              img.src = url;
            });
            ctx.save();
            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.blendMode || 'source-over';
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            ctx.restore();
          }
        }

        singleCanvas.toBlob((blob) => {
          if (blob) {
            downloadBlob(blob, `${project.title}_Quadro_${project.currentFrameIndex + 1}_${targetWidth}x${targetHeight}.png`);
          }
        }, 'image/png');
      }

      setProgress({ percent: 100, statusText: 'Exportação concluída com sucesso!' });
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Erro na exportação:', err);
      setExportError(err?.message || 'Falha ao processar exportação');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-950/40">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-neutral-100">
                Exportar Animação em Alta Resolução
              </h3>
              <p className="text-xs text-neutral-400">
                Vídeo MP4 (MediaRecorder), WebM, GIF Animado e Sequência PNG
              </p>
            </div>
          </div>

          {!isExporting && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* 1. Format Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300">
                Formato de Exportação:
              </span>
              {format === 'mp4' && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>MediaRecorder API: {hasNativeMp4 ? 'MP4 Nativo' : 'MP4 Container'}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* MP4 Video Option */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setFormat('mp4')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'mp4'
                    ? 'bg-red-600/20 text-white border-red-500 shadow-md shadow-red-950/30 ring-1 ring-red-500/40'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileVideo className={`w-5 h-5 ${format === 'mp4' ? 'text-red-400' : 'text-neutral-400'}`} />
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-red-950 text-red-300 border border-red-800/50">
                    MP4 Vídeo
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs">Vídeo MP4</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    MediaRecorder do navegador. Compatível com WhatsApp, Instagram e editores.
                  </div>
                </div>
              </button>

              {/* WebM Video Option */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setFormat('webm')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'webm'
                    ? 'bg-red-600/20 text-white border-red-500 shadow-md shadow-red-950/30 ring-1 ring-red-500/40'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Film className={`w-5 h-5 ${format === 'webm' ? 'text-red-400' : 'text-neutral-400'}`} />
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-800 text-neutral-300">
                    VP9 Web
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs">Vídeo WebM</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Alta compressão VP9 para web e navegadores.
                  </div>
                </div>
              </button>

              {/* Animated GIF Option */}
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setFormat('gif')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  format === 'gif'
                    ? 'bg-red-600/20 text-white border-red-500 shadow-md shadow-red-950/30 ring-1 ring-red-500/40'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Video className={`w-5 h-5 ${format === 'gif' ? 'text-red-400' : 'text-neutral-400'}`} />
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-800 text-neutral-300">
                    GIF
                  </span>
                </div>
                <div>
                  <div className="font-bold text-xs">GIF Animado</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    Loop contínuo para redes e fóruns.
                  </div>
                </div>
              </button>
            </div>

            {/* Secondary formats: ZIP and PNG snapshot */}
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setFormat('zip')}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  format === 'zip'
                    ? 'bg-red-600/20 text-white border-red-500'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80'
                }`}
              >
                <FolderArchive className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Sequência PNG (.ZIP)</div>
                  <div className="text-[10px] text-neutral-400">Quadros numerados + JSON</div>
                </div>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => setFormat('png-current')}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                  format === 'png-current'
                    ? 'bg-red-600/20 text-white border-red-500'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-neutral-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Snapshot PNG (Quadro Atual)</div>
                  <div className="text-[10px] text-neutral-400">Imagem estática em alta res</div>
                </div>
              </button>
            </div>
          </div>

          {/* MediaRecorder MP4 Note */}
          {format === 'mp4' && (
            <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-start gap-2.5 text-xs text-neutral-300">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-neutral-200">Exportação de Vídeo MP4 via MediaRecorder:</span>
                <p className="text-neutral-400 text-[11px] mt-0.5">
                  Os quadros do projeto são renderizados na resolução escolhida e capturados diretamente pelo stream do navegador, gerando um arquivo de vídeo com timing exato no FPS configurado ({fps} FPS).
                </p>
              </div>
            </div>
          )}

          {/* 2. Resolution Selection (High Res) */}
          <div>
            <span className="text-xs font-semibold text-neutral-300 block mb-2">
              Resolução de Saída:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {resolutionPresets.map((preset) => {
                const isSelected = resolutionId === preset.id;
                return (
                  <button
                    key={preset.id}
                    disabled={isExporting}
                    onClick={() => setResolutionId(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-neutral-800 text-white border-red-500 shadow-sm'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs">{preset.label}</span>
                        {preset.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-red-950 text-red-400 border border-red-800/40">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        {preset.id === 'custom' ? `${customWidth} × ${customHeight}` : `${preset.width} × ${preset.height}`} ({preset.aspect})
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-red-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {resolutionId === 'custom' && (
              <div className="mt-3 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Largura:</span>
                  <input
                    type="number"
                    min="256"
                    max="4096"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value) || 1920)}
                    className="w-20 bg-neutral-800 text-white font-mono px-2 py-1 rounded border border-neutral-700 outline-none"
                  />
                  <span className="text-neutral-500">px</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">Altura:</span>
                  <input
                    type="number"
                    min="256"
                    max="4096"
                    value={customHeight}
                    onChange={(e) => setCustomHeight(parseInt(e.target.value) || 1080)}
                    className="w-20 bg-neutral-800 text-white font-mono px-2 py-1 rounded border border-neutral-700 outline-none"
                  />
                  <span className="text-neutral-500">px</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Export Parameters & Options */}
          <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-neutral-400 block mb-1">Taxa de Quadros (FPS):</span>
                <select
                  value={fps}
                  disabled={isExporting}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  className="w-full bg-neutral-800 text-neutral-200 text-xs px-3 py-1.5 rounded-lg border border-neutral-700 outline-none font-mono"
                >
                  <option value="6">6 FPS</option>
                  <option value="8">8 FPS</option>
                  <option value="12">12 FPS (Padrão 2D Clássico)</option>
                  <option value="16">16 FPS</option>
                  <option value="24">24 FPS (Cinema & Anime)</option>
                  <option value="30">30 FPS (Fluidez Máxima)</option>
                </select>
              </div>

              <div>
                <span className="text-neutral-400 block mb-1">Cor de Fundo:</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
                    <input
                      type="checkbox"
                      checked={includeBackground}
                      disabled={isExporting}
                      onChange={(e) => setIncludeBackground(e.target.checked)}
                      className="accent-red-500 rounded"
                    />
                    <span>Incluir Fundo</span>
                  </label>
                  {includeBackground && (
                    <input
                      type="color"
                      value={backgroundColor}
                      disabled={isExporting}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 ml-auto"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={renderTransitions}
                  disabled={isExporting}
                  onChange={(e) => setRenderTransitions(e.target.checked)}
                  className="accent-red-500 rounded"
                />
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Renderizar Transições Entre Quadros</span>
              </label>

              {project.camera3D?.enabled && (
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                  <input
                    type="checkbox"
                    checked={applyCamera3D}
                    disabled={isExporting}
                    onChange={(e) => setApplyCamera3D(e.target.checked)}
                    className="accent-blue-500 rounded"
                  />
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Aplicar Câmera 3D & Parallax</span>
                </label>
              )}
            </div>
          </div>

          {/* Progress Bar (Visible during export) */}
          {isExporting && (
            <div className="bg-neutral-950 p-4 rounded-xl border border-red-500/40 space-y-2.5 animate-pulse">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-200">{progress.statusText}</span>
                <span className="font-mono text-red-400 font-bold tabular-nums">{progress.percent}%</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {exportError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{exportError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div className="text-xs text-neutral-400 font-mono">
            <span>Formato: {format.toUpperCase()}</span>
            <span className="mx-1.5">·</span>
            <span>{targetWidth}×{targetHeight}</span>
            <span className="mx-1.5">·</span>
            <span>{project.frames.length} quadros</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleStartExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-950/50 hover:shadow-red-900/60 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Gravando Vídeo...' : `Exportar ${format.toUpperCase()}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
