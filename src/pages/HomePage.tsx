import { useState } from 'react';
import { User, Truck, Navigation, Wifi, Compass } from 'lucide-react';
import { TranslationSchema } from '../i18n';
import ClientTab from '../components/ClientTab';
import DriverTab from '../components/DriverTab';
import LivraisonMap from '../components/LivraisonMap';
import LivreurApp from '../components/LivreurApp';
import SuiviLivraison from '../components/SuiviLivraison';

interface HomePageProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
}

export default function HomePage({ t, lang }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<'client' | 'matching' | 'driver' | 'telemetry' | 'suivi'>('client');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title & Subtitle */}
      <div className="text-center py-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-theme-text mb-2">
          {t.home.title}
        </h1>
        <p className="text-theme-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
          {t.home.subtitle}
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-theme-card p-1.5 rounded-2xl border border-theme-border-thin shadow-inner gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('client')}
          className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 min-w-[100px] whitespace-nowrap ${
            activeTab === 'client'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/10'
              : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-card-hover'
          }`}
        >
          <User size={15} />
          {t.home.clientTab}
        </button>

        <button
          onClick={() => setActiveTab('matching')}
          className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 min-w-[100px] whitespace-nowrap ${
            activeTab === 'matching'
              ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/10'
              : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-card-hover'
          }`}
        >
          <Navigation size={15} className="rotate-45" />
          {lang === 'fr' ? 'Matching Carte' : 'Matching Map'}
        </button>

        <button
          onClick={() => setActiveTab('suivi')}
          className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 min-w-[100px] whitespace-nowrap ${
            activeTab === 'suivi'
              ? 'bg-gradient-to-r from-sky-450 to-sky-550 text-white shadow-lg shadow-sky-500/10'
              : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-card-hover'
          }`}
        >
          <Compass size={15} />
          {lang === 'fr' ? 'Suivi Live' : 'Live Tracking'}
        </button>

        <button
          onClick={() => setActiveTab('driver')}
          className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 min-w-[100px] whitespace-nowrap ${
            activeTab === 'driver'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/10'
              : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-card-hover'
          }`}
        >
          <Truck size={15} />
          {t.home.driverTab}
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all duration-300 min-w-[100px] whitespace-nowrap ${
            activeTab === 'telemetry'
              ? 'bg-gradient-to-r from-red-500 to-red-650 text-white shadow-lg shadow-red-500/10'
              : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-card-hover'
          }`}
        >
          <Wifi size={15} className="animate-pulse" />
          {lang === 'fr' ? 'Livreur Télémétrie' : 'Driver Telemetry'}
        </button>
      </div>

      {/* Active Area View */}
      {activeTab === 'client' && (
        <ClientTab t={t} lang={lang} />
      )}
      {activeTab === 'matching' && (
        <LivraisonMap lang={lang} />
      )}
      {activeTab === 'suivi' && (
        <SuiviLivraison lang={lang} />
      )}
      {activeTab === 'driver' && (
        <DriverTab t={t} lang={lang} />
      )}
      {activeTab === 'telemetry' && (
        <LivreurApp lang={lang} />
      )}
    </div>
  );
}
