import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  Monitor, 
  Apple, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  ExternalLink,
  Share,
  Check
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  // App URL for direct browser access
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-njm2ywcz5alj5effe7uykx-227746483595.europe-west2.run.app';

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenBrowserTab = () => {
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-950/40 font-display font-extrabold text-base">
              AC
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-neutral-100">
                Baixar no seu Celular
              </h3>
              <p className="text-xs text-neutral-400">
                Instale o AnimaClip Studio como aplicativo nativo
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

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Direct Install Button if browser supports 1-click install */}
          {isInstalled ? (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block text-emerald-200">App Já Instalado!</span>
                <span>O AnimaClip Studio já está instalado no seu celular. Acesse pelo ícone na tela inicial.</span>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="p-4 bg-gradient-to-r from-red-950/70 to-neutral-900 border border-red-500/50 rounded-xl space-y-2.5 shadow-lg">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Instalação Automática Disponível</span>
              </div>
              <p className="text-xs text-neutral-300">
                Toque no botão abaixo para adicionar o AnimaClip Studio diretamente à tela de início do seu celular.
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-950/50 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Agora no Celular</span>
              </button>
            </div>
          ) : null}

          {/* Quick Action: Open in Native Browser or Copy Direct Link */}
          <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-2.5">
            <span className="text-xs font-semibold text-neutral-200 block">
              Link Direto do Aplicativo:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="bg-neutral-800 text-neutral-300 font-mono text-[11px] px-2.5 py-1.5 rounded-lg border border-neutral-700 outline-none flex-1 truncate select-all"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <button
              onClick={handleOpenBrowserTab}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold border border-neutral-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Abrir no Navegador do Celular (Chrome / Safari)</span>
            </button>
          </div>

          {/* PWABuilder (Gerar APK) Section */}
          <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Gerar APK Android no PWABuilder</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50">
                100% Compatível
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              O <code className="text-purple-300">manifest.json</code>, <code className="text-purple-300">sw.js</code> e os ícones 192/512 já estão configurados. Cole a URL no <strong>PWABuilder</strong> para gerar o arquivo <strong className="text-purple-300">.APK / .AAB</strong> para a Google Play ou instalação direta.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-semibold border border-purple-700/50 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Link Copiado!' : 'Copiar URL para o PWABuilder'}</span>
              </button>
              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium border border-neutral-700 transition-colors"
              >
                <span>Abrir PWABuilder</span>
                <ExternalLink className="w-3 h-3 text-neutral-400" />
              </a>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-neutral-300 block">
              Passo a passo no seu celular:
            </span>

            {/* Android */}
            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-1">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold text-xs">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>No Android (Google Chrome)</span>
              </div>
              <ol className="text-neutral-400 text-xs list-decimal list-inside space-y-1 pl-1">
                <li>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito do Chrome.</li>
                <li>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                <li>Confirme em <strong>"Instalar"</strong>.</li>
              </ol>
            </div>

            {/* iPhone & iPad */}
            <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-1">
              <div className="flex items-center gap-2 text-neutral-200 font-semibold text-xs">
                <Apple className="w-4 h-4 text-neutral-300" />
                <span>No iPhone ou iPad (Safari)</span>
              </div>
              <ol className="text-neutral-400 text-xs list-decimal list-inside space-y-1 pl-1">
                <li>Abra o link no navegador <strong>Safari</strong>.</li>
                <li>Toque no botão <strong>Compartilhar</strong> (quadrado com seta para cima).</li>
                <li>Role e selecione <strong>"Adicionar à Tela de Início"</strong>.</li>
                <li>Toque em <strong>"Adicionar"</strong> no topo direito.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            Funciona offline em tela cheia
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
