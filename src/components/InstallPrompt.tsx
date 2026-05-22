import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  lang: 'fr' | 'en';
}

export default function InstallPrompt({ lang }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the default browser prompt banner
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom prompt banner
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If already installed or active, can check if in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    if (isStandalone) {
      setShow(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    // Show the native installation prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We no longer need the prompt, clear it
    setDeferredPrompt(null);
    setShow(false);
    
    console.log(`User installation decision: ${outcome}`);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-md bg-theme-card/95 border border-orange-500/20 px-4 py-3.5 rounded-2xl flex items-center justify-between gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 animate-fade-in backdrop-blur-xl">
      <div className="flex-1 min-w-0 pr-1">
        <p className="font-bold text-xs text-orange-400 uppercase tracking-wider">
          {lang === 'fr' ? 'ALGS sur votre écran' : 'ALGS on your screen'}
        </p>
        <p className="text-xs text-theme-text-secondary leading-tight mt-0.5 truncate">
          {lang === 'fr' ? 'Installer l’application web ALGS Live' : 'Install ALGS Live mobile application'}
        </p>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={handleInstall}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
        >
          <Download size={14} />
          {lang === 'fr' ? 'Installer' : 'Install'}
        </button>
        
        <button 
          onClick={() => setShow(false)}
          className="text-theme-text-muted hover:text-theme-text hover:bg-theme-card-hover p-1.5 rounded-xl transition-colors"
          aria-label="Fermer"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
