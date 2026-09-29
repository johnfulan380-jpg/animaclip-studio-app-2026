import React, { useState } from 'react';
import { 
  FolderOpen, 
  Plus, 
  X, 
  Sparkles, 
  Check, 
  Film, 
  Layers, 
  PlaySquare,
  ArrowRight
} from 'lucide-react';
import { AnimationProject } from '../types/animation';
import { createBouncingBallProject, createBlankProject } from '../utils/sampleProjects';

interface ProjectSettingsModalProps {
  onLoadProject: (project: AnimationProject) => void;
  onClose: () => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  onLoadProject,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'samples' | 'new'>('samples');
  
  // New project state
  const [newTitle, setNewTitle] = useState('Minha Animação 2D');
  const [newWidth, setNewWidth] = useState(1920);
  const [newHeight, setNewHeight] = useState(1080);
  const [newFps, setNewFps] = useState(12);

  const handleCreateNew = () => {
    const proj = createBlankProject(newTitle, newWidth, newHeight, newFps);
    // Add default camera3D
    proj.camera3D = {
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
    onLoadProject(proj);
    onClose();
  };

  const sampleProjects = [
    {
      id: 'bouncing-ball',
      title: 'Bola Saltitante (Squash & Stretch)',
      category: 'Princípios da Animação Clássica',
      description: '12 quadros demonstrando deformação, aceleração, sombra dinâmica e camadas separadas de linha guia e impacto.',
      frames: 12,
      layers: 3,
      fps: 12,
      resolution: '1280x720 (HD)',
      loadFn: () => {
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
        return p;
      },
    },
    {
      id: 'walk-cycle',
      title: 'Ciclo de Caminhada (Walk Cycle)',
      category: 'Animação de Personagem',
      description: '8 quadros com poses clássicas de caminhada: contato, descida, passagem e subida com ritmo fluido.',
      frames: 8,
      layers: 2,
      fps: 12,
      resolution: '1920x1080 (Full HD)',
      loadFn: () => {
        const p = createBlankProject('Ciclo de Caminhada', 1920, 1080, 12);
        // Preload a simple walk cycle frames
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
        return p;
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 text-red-500 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-neutral-100">
                Gerenciador de Projetos
              </h3>
              <p className="text-xs text-neutral-400">
                Criar novo projeto ou carregar modelos de exemplo prontos
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

        {/* Tab switch */}
        <div className="px-5 pt-3 pb-0 flex border-b border-neutral-800 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('samples')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'samples'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Exemplos Prontos</span>
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Novo Projeto</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {activeTab === 'samples' ? (
            <div className="space-y-3">
              {sampleProjects.map((sample) => (
                <div
                  key={sample.id}
                  className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 transition-all flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        {sample.category}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        {sample.resolution} · {sample.fps} FPS
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-neutral-100">{sample.title}</h4>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {sample.frames} quadros · {sample.layers} camadas
                    </span>

                    <button
                      onClick={() => {
                        onLoadProject(sample.loadFn());
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-red-950/40"
                    >
                      <span>Abrir Projeto</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Nome do Projeto:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-800 text-neutral-100 text-xs px-3 py-2 rounded-xl border border-neutral-700 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Resoluções Padrão:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'Full HD 1080p (1920x1080)', w: 1920, h: 1080 },
                    { label: '4K Ultra HD (3840x2160)', w: 3840, h: 2160 },
                    { label: 'HD 720p (1280x720)', w: 1280, h: 720 },
                    { label: 'Quadrado (1080x1080)', w: 1080, h: 1080 },
                    { label: 'Vertical TikTok (1080x1920)', w: 1080, h: 1920 },
                  ].map((res) => (
                    <button
                      key={res.label}
                      onClick={() => {
                        setNewWidth(res.w);
                        setNewHeight(res.h);
                      }}
                      className={`p-2 rounded-xl border text-left transition-colors ${
                        newWidth === res.w && newHeight === res.h
                          ? 'bg-red-600/20 text-white border-red-500'
                          : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="font-semibold block">{res.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 block mb-1">Taxa de Quadros (FPS):</span>
                  <select
                    value={newFps}
                    onChange={(e) => setNewFps(parseInt(e.target.value))}
                    className="w-full bg-neutral-800 text-neutral-200 px-3 py-2 rounded-xl border border-neutral-700 outline-none font-mono"
                  >
                    <option value="8">8 FPS (Stop Motion)</option>
                    <option value="12">12 FPS (Padrão 2D Clássico)</option>
                    <option value="24">24 FPS (Cinema & Anime)</option>
                    <option value="30">30 FPS (Fluidez)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCreateNew}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-950/40"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Projeto em Branco</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
