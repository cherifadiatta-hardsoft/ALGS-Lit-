import { X, Globe, Home, BookOpen, Heart, Compass, Shield, Activity } from 'lucide-react';
import { TranslationSchema } from '../i18n';

interface SideMenuProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  page: string;
  setPage: (page: string) => void;
  lang: 'fr' | 'en';
  setLang: (lang: 'fr' | 'en') => void;
  t: TranslationSchema;
}

export default function SideMenu({ isOpen, setIsOpen, page, setPage, lang, setLang, t }: SideMenuProps) {
  const menuItems = [
    { key: 'home', label: t.menu.home, icon: <Home size={18} /> },
    { key: 'traffic', label: t.menu.traffic, icon: <Activity size={18} /> },
    { key: 'about', label: t.menu.about, icon: <BookOpen size={18} /> },
    { key: 'donate', label: t.menu.donate, icon: <Heart size={18} /> },
    { key: 'roadmap', label: t.menu.roadmap, icon: <Compass size={18} /> },
    { key: 'privacy', label: t.menu.privacy, icon: <Shield size={18} /> }
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-[#090b0f] border-r border-white/10 z-50 transform transition-transform duration-300 ease-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="p-5 flex justify-between items-center border-b border-white/10">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 font-sans tracking-tight">
              {t.appName}
            </h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 text-white/60 hover:text-white transition-colors"
              title="Fermer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map(item => {
              const isActive = page === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { 
                    setPage(item.key); 
                    setIsOpen(false); 
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-2xl flex items-center gap-3.5 text-sm font-bold transition-all ${
                    isActive
                     ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/10'
                     : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-orange-400/80'}>
                    {item.icon}
                  </span>
                  <span className="font-sans font-bold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Language Section */}
        <div className="p-5 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 text-white/50">
            <Globe size={16} className="text-orange-400" />
            <span className="text-xs font-bold font-sans uppercase tracking-wider">Langue / Language</span>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setLang('fr')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                lang === 'fr'
                  ? 'bg-orange-500 border-orange-500 text-white shadow-md' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              FR (Français)
            </button>
            <button
              onClick={() => setLang('en')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                lang === 'en'
                  ? 'bg-orange-500 border-orange-500 text-white shadow-md' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              EN (English)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
