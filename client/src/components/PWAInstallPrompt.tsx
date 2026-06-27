import { useEffect, useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone) return;

    const dismissed = sessionStorage.getItem('pwa-install-prompt-dismissed');
    if (dismissed) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
    if (ios) {
      setIsIOS(true);
      setVisible(true);
      return;
    }

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setVisible(false);
    setDeferredPrompt(null);

    if (outcome === 'dismissed') {
      sessionStorage.setItem('pwa-install-prompt-dismissed', '1');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa-install-prompt-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="relative max-w-lg mx-auto bg-gradient-to-r from-violet-900/95 to-purple-900/95 backdrop-blur-md border border-violet-500/40 rounded-2xl shadow-2xl p-4">
        <button
          onClick={handleDismiss}
          aria-label="Fechar aviso de instalacao"
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="bg-violet-600/30 p-2.5 rounded-xl flex-shrink-0">
            <Smartphone className="w-6 h-6 text-violet-300" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Instale o aplicativo</p>
            <p className="text-gray-300 text-xs mt-0.5 leading-relaxed">
              {isIOS
                ? 'Toque em Compartilhar e depois em "Adicionar a Tela de Inicio".'
                : 'Toque em instalar para adicionar o app a tela inicial.'}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              {isIOS ? (
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 h-8 flex items-center gap-1.5"
                >
                  <Share className="w-3.5 h-3.5" />
                  Entendi
                </Button>
              ) : (
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-4 h-8 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Instalar
                </Button>
              )}

              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white text-xs h-8"
              >
                Agora nao
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
