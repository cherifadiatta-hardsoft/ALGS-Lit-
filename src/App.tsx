import { useState, useEffect } from 'react';
import { Menu, Navigation, BookOpen, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';
import { translations } from './i18n';
import SideMenu from './components/SideMenu';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DonatePage from './pages/DonatePage';
import RoadmapPage from './pages/RoadmapPage';
import PrivacyPage from './pages/PrivacyPage';
import TrackingPage from './pages/TrackingPage';
import TrafficPage from './pages/TrafficPage';
import InstallPrompt from './components/InstallPrompt';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const [page, setPage] = useState<string>('home');
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const { theme } = useTheme();

  const t = translations[lang];

  // Parse track param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    if (trackId) {
      setTrackingId(trackId);
      setPage('track');
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        )
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && 
          !(document as any).webkitFullscreenElement && 
          !(document as any).mozFullScreenElement && 
          !(document as any).msFullscreenElement) {
        
        const docElem = document.documentElement as any;
        if (docElem.requestFullscreen) {
          await docElem.requestFullscreen();
        } else if (docElem.mozRequestFullScreen) {
          await docElem.mozRequestFullScreen();
        } else if (docElem.webkitRequestFullscreen) {
          await docElem.webkitRequestFullscreen();
        } else if (docElem.msRequestFullscreen) {
          await docElem.msRequestFullscreen();
        }
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen mode:", err);
    }
  };

  // Helper function to render active page with complete state preservation
  const renderPage = () => {
    switch(page) {
      case 'home': 
        return <HomePage t={t} lang={lang} />;
      case 'about': 
        return <AboutPage t={t} lang={lang} />;
      case 'donate': 
        return <DonatePage t={t} lang={lang} />;
      case 'roadmap': 
        return <RoadmapPage t={t} lang={lang} />;
      case 'traffic':
        return <TrafficPage t={t} lang={lang} />;
      case 'privacy':
        return <PrivacyPage t={t} lang={lang} onBackToHome={() => setPage('home')} />;
      case 'track':
        return (
          <TrackingPage 
            shareId={trackingId || ''} 
            lang={lang} 
            onBackToHome={() => {
              setPage('home');
              setTrackingId(null);
              window.history.replaceState({}, '', window.location.pathname);
            }} 
          />
        );
      default: 
        return <HomePage t={t} lang={lang} />;
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg px-4 py-6 flex flex-col justify-between selection:bg-orange-500/30 selection:text-orange-200 relative overflow-hidden font-sans text-theme-text transition-colors duration-200">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-orange-500/[0.04] blur-[125px] pointer-events-none -mr-48 -mt-24" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-emerald-500/[0.04] blur-[130px] pointer-events-none -ml-52 -mb-28" />
      
      {/* SideMenu Drawer */}
      <SideMenu
        isOpen={menuOpen}
        setIsOpen={setMenuOpen}
        page={page}
        setPage={setPage}
        lang={lang}
        setLang={setLang}
        t={t}
      />

      {/* Main Container Layout */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto space-y-7 relative z-10 flex-1 flex flex-col justify-start">
        
        {/* Top Navbar Header */}
        <header className="flex items-center justify-between pb-3 border-b border-theme-border-thin mt-1">
          <div className="flex gap-2">
            <button 
              onClick={() => setMenuOpen(true)}
              className="p-2.5 bg-theme-card border border-theme-border rounded-2xl text-theme-text hover:text-orange-400 hover:bg-theme-card-hover transition-all flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
              title="Menu"
            >
              <Menu size={20} />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2.5 bg-theme-card border border-theme-border rounded-2xl text-theme-text hover:text-orange-400 hover:bg-theme-card-hover transition-all flex items-center justify-center shadow-lg hover:scale-105 active:scale-95"
              title={isFullscreen ? (lang === 'fr' ? 'Quitter le plein écran' : 'Exit Fullscreen') : (lang === 'fr' ? 'Plein écran' : 'Fullscreen')}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 select-none font-sans font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-500">
            <Navigation size={16} className="text-emerald-400 rotate-45 animate-pulse" />
            <span>ALG<span className="text-theme-text">S</span></span>
          </div>

          <div className="flex gap-1.5 bg-theme-card border border-theme-border-thin px-2.5 py-1.5 rounded-xl text-[10px] font-bold font-mono text-theme-text-secondary">
            <button 
              onClick={() => setLang('fr')} 
              className={`hover:text-theme-text transition-colors uppercase ${lang === 'fr' ? 'text-orange-400 font-extrabold' : ''}`}
            >
              FR
            </button>
            <span className="text-theme-text-muted/40">•</span>
            <button 
              onClick={() => setLang('en')} 
              className={`hover:text-theme-text transition-colors uppercase ${lang === 'en' ? 'text-orange-400 font-extrabold' : ''}`}
            >
              EN
            </button>
          </div>
        </header>

        {/* Dynamic Main Page Content */}
        <main className="flex-1 min-h-[420px]">
          {renderPage()}
        </main>

        {/* Dynamic Help Component displayed on Home Page */}
        {page === 'home' && (
          <div className="bg-theme-card rounded-3xl border border-theme-border overflow-hidden transition-all duration-300">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-theme-card-hover transition-colors"
            >
              <span className="text-xs font-bold text-theme-text uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={14} className="text-orange-400" />
                {lang === 'fr' ? 'Comment ça fonctionne ?' : 'How does it work?'}
              </span>
              <HelpCircle size={16} className={`text-theme-text-muted transition-transform ${showHelp ? 'rotate-180 text-orange-400' : ''}`} />
            </button>
            
            {showHelp && (
              <div className="px-5 pb-5 pt-1 space-y-4 border-t border-theme-border text-xs text-theme-text-secondary leading-relaxed font-sans">
                {lang === 'fr' ? (
                  <>
                    <div className="space-y-2">
                      <p className="font-bold text-theme-text text-[11px] uppercase tracking-wider text-orange-300">🔄 Flux Client (Partage vers Livreur) :</p>
                      <ol className="list-decimal pl-4 space-y-2 text-theme-text-secondary">
                        <li>Saisissez le <strong>numéro du livreur</strong> (au format international, ex: <span className="font-mono text-orange-400">221770000000</span>).</li>
                        <li>Cliquez sur <strong>Partager ma position GPS</strong>.</li>
                        <li>L'application calcule vos coordonnées de haute précision et ouvre WhatsApp avec un message prérempli.</li>
                        <li>Le livreur clique et suit l'itinéraire sur <strong>Google Maps</strong>.</li>
                      </ol>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-theme-border-thin">
                      <p className="font-bold text-theme-text text-[11px] uppercase tracking-wider text-emerald-300">🏁 Flux Livreur (Partage vers Client) :</p>
                      <ol className="list-decimal pl-4 space-y-2 text-theme-text-secondary">
                        <li>Saisissez le <strong>numéro du client</strong> (ex: <span className="font-mono text-emerald-400">22177XXXXXXX</span>).</li>
                        <li>Cliquez sur <strong>Envoyer ma position au client</strong>.</li>
                        <li>Vos coordonnées sont transmises pour permettre le suivi en direct sur Google Maps.</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="font-bold text-theme-text text-[11px] uppercase tracking-wider text-orange-300">🔄 Client Flow (Share to Driver) :</p>
                      <ol className="list-decimal pl-4 space-y-2 text-theme-text-secondary">
                        <li>Type the <strong>driver's number</strong> (with country code, eg: <span className="font-mono text-orange-400">221770000000</span>).</li>
                        <li>Click <strong>Share my GPS Location</strong>.</li>
                        <li>High precision coordinates are determined and deep-linked into WhatsApp with a ready message.</li>
                        <li>The driver opens the link to navigate directly using <strong>Google Maps</strong>.</li>
                      </ol>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-theme-border-thin">
                      <p className="font-bold text-theme-text text-[11px] uppercase tracking-wider text-emerald-300">🏁 Driver Flow (Share to Client) :</p>
                      <ol className="list-decimal pl-4 space-y-2 text-theme-text-secondary">
                        <li>Type the <strong>customer's phone number</strong> (eg: <span className="font-mono text-emerald-400">22177XXXXXXX</span>).</li>
                        <li>Click <strong>Send my location to Client</strong>.</li>
                        <li>Your GPS map coordinates are shared so the client knows exactly when you will arrive.</li>
                      </ol>
                    </div>
                  </>
                )}

                <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/20 text-[11px] mt-2">
                  <p className="font-semibold text-orange-300">⚡ {lang === 'fr' ? "Calibrage GPS Optimal" : "Optimal GPS Calibration"} :</p>
                  <p className="mt-0.5 text-theme-text-secondary">
                    {lang === 'fr' 
                      ? "Autorisez l'accès à l'emplacement GPS pour des résultats optimaux. Pour une précision parfaite, placez-vous à l'extérieur."
                      : "Authorize location settings for best performance. For perfect satellite tracking, stand outside in an open area."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Element */}
      <footer className="w-full max-w-sm mx-auto text-center mt-12 space-y-2.5 relative z-10 select-none pb-2">
        <p className="text-[10px] text-theme-text-muted font-mono tracking-wide">
          ALGS v1.1.0 • PWA Enabled • Offline Responsive
        </p>
        <div className="pt-2.5 border-t border-theme-border-thin text-[10px] text-theme-text-muted">
          <span>Tout droit réservé • Développé par </span>
          <a 
            href="https://www.hardsoft-technologies.net" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 transition-colors font-bold underline decoration-dotted underline-offset-4"
          >
            HardSoft Technologies
          </a>
        </div>
      </footer>
      <InstallPrompt lang={lang} />
    </div>
  );
}
