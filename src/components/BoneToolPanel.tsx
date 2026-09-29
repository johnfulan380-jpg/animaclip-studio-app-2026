import React from 'react';
import { 
  GitCommit, 
  Move, 
  Plus, 
  RotateCw, 
  Trash2, 
  User, 
  Key, 
  Layers, 
  Check,
  Sparkles
} from 'lucide-react';
import { Bone, Layer } from '../types/animation';
import { createHumanoidSkeleton } from '../utils/skeletalEngine';

interface BoneToolPanelProps {
  bones: Bone[];
  activeBoneId?: string;
  boneMode: 'pose' | 'create';
  onChangeBoneMode: (mode: 'pose' | 'create') => void;
  onSelectBone: (boneId: string | null) => void;
  onUpdateBones: (bones: Bone[]) => void;
  activeLayer: Layer;
  onBindLayerToBone: (layerId: string, boneId: string) => void;
  onSavePoseToFrame: () => void;
  currentFrameIndex: number;
}

export const BoneToolPanel: React.FC<BoneToolPanelProps> = ({
  bones,
  activeBoneId,
  boneMode,
  onChangeBoneMode,
  onSelectBone,
  onUpdateBones,
  activeLayer,
  onBindLayerToBone,
  onSavePoseToFrame,
  currentFrameIndex,
}) => {
  const selectedBone = bones.find((b) => b.id === activeBoneId);

  const handleLoadHumanoid = () => {
    const humanoidBones = createHumanoidSkeleton(640, 380);
    onUpdateBones(humanoidBones);
    onSelectBone(humanoidBones[0].id);
  };

  const handleClearBones = () => {
    if (confirm('Deseja remover todos os ossos da animação?')) {
      onUpdateBones([]);
      onSelectBone(null);
    }
  };

  return (
    <div className="h-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 flex items-center justify-between z-10 shrink-0 text-xs text-neutral-200 overflow-x-auto">
      {/* Left: Mode toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-bold text-neutral-100">
          <GitCommit className="w-4 h-4 text-amber-500" />
          <span>Esqueleto & Ossos:</span>
        </div>

        {/* Mode Segmented Button */}
        <div className="flex bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
          <button
            onClick={() => onChangeBoneMode('pose')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              boneMode === 'pose'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Move className="w-3 h-3" />
            <span>Posar Personagem</span>
          </button>
          <button
            onClick={() => onChangeBoneMode('create')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
              boneMode === 'create'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Plus className="w-3 h-3" />
            <span>Criar Ossos</span>
          </button>
        </div>

        <div className="h-4 w-px bg-neutral-800" />

        {/* Presets */}
        <button
          onClick={handleLoadHumanoid}
          title="Carregar Estrutura Óssea Humanoide Completa"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-colors"
        >
          <User className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Rig Humanoide</span>
        </button>

        {bones.length > 0 && (
          <button
            onClick={handleClearBones}
            title="Limpar todos os ossos"
            className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right: Selected bone actions & Pose keyframing */}
      <div className="flex items-center gap-3">
        {selectedBone ? (
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Osso:</span>
            <span className="font-semibold text-amber-400">{selectedBone.name}</span>

            <button
              onClick={() => onBindLayerToBone(activeLayer.id, selectedBone.id)}
              title={`Vincular a camada atual (${activeLayer.name}) ao osso ${selectedBone.name}`}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors text-[11px]"
            >
              <Layers className="w-3 h-3 text-blue-400" />
              <span>Vincular Camada Ativa</span>
            </button>
          </div>
        ) : (
          <span className="text-neutral-500 text-[11px] hidden sm:inline">
            {boneMode === 'pose' ? 'Clique em qualquer junta para girar e posar' : 'Clique e arraste na tela para desenhar um novo osso'}
          </span>
        )}

        <div className="h-4 w-px bg-neutral-800" />

        {/* Save Pose to current frame */}
        <button
          onClick={onSavePoseToFrame}
          title={`Salvar a posição atual dos ossos no Quadro #${currentFrameIndex + 1}`}
          className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition-all shadow-sm"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Gravar Pose</span>
        </button>
      </div>
    </div>
  );
};
