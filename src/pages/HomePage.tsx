import { useState } from 'react';
import { User, Truck } from 'lucide-react';
import { TranslationSchema } from '../i18n';
import ClientTab from '../components/ClientTab';
import DriverTab from '../components/DriverTab';

interface HomePageProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
}

export default function HomePage({ t, lang }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<'client' | 'driver'>('client');

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
      <div className="flex bg-theme-card p-1.5 rounded-2xl border border-theme-border-thin shadow-inner">
        <button
          onClick={() => setActiveTab('client')}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 ${
            activeTab === 'client'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/10'
              : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-card-hover'
          }`}
        >
          <User size={18} />
          {t.home.clientTab}
        </button>
        <button
          onClick={() => setActiveTab('driver')}
          className={`flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 ${
            activeTab === 'driver'
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/10'
              : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-card-hover'
          }`}
        >
          <Truck size={18} />
          {t.home.driverTab}
        </button>
      </div>

      {/* Active Area View */}
      {activeTab === 'client' ? (
        <ClientTab t={t} lang={lang} />
      ) : (
        <DriverTab t={t} lang={lang} />
      )}
    </div>
  );
}
