import React from 'react';
import { HelpCircle, X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Espaço', desc: 'Reproduzir / Pausar animação' },
    { key: ',', desc: 'Quadro anterior' },
    { key: '.', desc: 'Próximo quadro' },
    { key: 'B', desc: 'Ferramenta Pincel (Caneta, Lápis, Marcador)' },
    { key: 'E', desc: 'Ferramenta Borracha' },
    { key: 'G', desc: 'Balde de Preenchimento Inteligente' },
    { key: 'L', desc: 'Laço de Seleção Livre' },
    { key: 'W', desc: 'Varinha Mágica' },
    { key: 'U', desc: 'Régua & Formas Geométricas' },
    { key: 'T', desc: 'Carimbo de Texto' },
    { key: 'I', desc: 'Conta-gotas (Capturar Cor)' },
    { key: 'O', desc: 'Alternar Papel Vegetal (Onion Skin)' },
    { key: 'C', desc: 'Alternar Painel de Câmera 3D & Parallax' },
    { key: '[ e ]', desc: 'Diminuir / Aumentar tamanho do pincel' },
    { key: 'N', desc: 'Adicionar novo quadro em branco' },
    { key: 'D', desc: 'Duplicar quadro atual' },
    { key: 'Ctrl + Z', desc: 'Desfazer último traço ou ação' },
    { key: 'Ctrl + Y', desc: 'Refazer ação' },
    { key: 'Scroll', desc: 'Pan e Zoom no palco' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-red-500" />
            <h3 className="font-display font-bold text-base text-neutral-100">
              Atalhos de Teclado do Estúdio
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-2">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-neutral-800/60 transition-colors text-xs"
            >
              <span className="text-neutral-300">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-neutral-200 font-bold shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
