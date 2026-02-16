import { useState, useEffect } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 z-40 max-w-sm mx-auto" data-testid="pwa-install-prompt">
      <div className="bg-popover border border-border rounded-xl p-4 shadow-2xl flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0">
          <Download className="h-5 w-5 text-gray-900" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Install App</p>
          <p className="text-xs text-muted-foreground truncate">Get the full experience on your device</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-yellow-500 text-gray-900 text-xs font-semibold rounded-lg hover:bg-yellow-400 transition-colors flex-shrink-0"
          data-testid="button-install-app"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-muted-foreground hover:text-foreground/80 transition-colors flex-shrink-0"
          data-testid="button-dismiss-install"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
