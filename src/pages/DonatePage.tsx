import { useState } from 'react';
import { Heart, Check } from 'lucide-react';
import { TranslationSchema } from '../i18n';

interface DonatePageProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
}

export default function DonatePage({ t, lang }: DonatePageProps) {
  const [copiedText, setCopiedText] = useState<'om' | 'wave' | null>(null);
  const isFr = lang === 'fr';

  const handleCopy = (text: string, type: 'om' | 'wave') => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const numberToCopy = '+221781466421';

  return (
    <div className="space-y-6 animate-fade-in text-slate-200 py-1 font-sans">
      {/* Page Header */}
      <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
        <Heart className="text-[#FF7A00] fill-[#FF7A00] animate-pulse shrink-0" size={24} />
        <span>
          {isFr ? 'Soutenez le développement d’ALGS Live' : 'Support ALGS Live development'}
        </span>
      </h1>

      <p className="text-sm text-slate-400 leading-relaxed">
        {isFr 
          ? "ALGS est gratuit aujourd'hui. Votre don permet de garder l'app rapide, sans bug, et d'ajouter de nouvelles fonctionnalités innovantes pour la communauté."
          : "ALGS is free today. Your donation allows us to keep the app fast, bug-free, and to add new innovative features for the community."}
      </p>

      {/* Why Support Card */}
      <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white">
          {isFr ? 'Pourquoi faire un don ?' : 'Why donate?'}
        </h3>
        <ul className="space-y-2.5 text-xs text-slate-400">
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-400 font-extrabold select-none shrink-0">✓</span>
            <span>
              {isFr 
                ? "Garder l'app gratuite pour les particuliers et livreurs indépendants."
                : "Keep the app free for individuals and independent delivery drivers."}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-400 font-extrabold select-none shrink-0">✓</span>
            <span>
              {isFr 
                ? "Ajouter le suivi en temps réel et les notifications push sur mobile."
                : "Add real-time tracking and push notifications on mobile devices."}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-emerald-400 font-extrabold select-none shrink-0">✓</span>
            <span>
              {isFr 
                ? "Développer la version PRO spécifique pour la gestion des entreprises."
                : "Develop a specific PRO version tailored for corporate management."}
            </span>
          </li>
        </ul>
      </div>

      {/* Donation Methods */}
      <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            {isFr ? 'Comment faire un don ?' : 'How to donate?'}
          </h3>
          <p className="text-xs text-slate-400">
            {isFr 
              ? 'C’est simple, rapide et 100% sécurisé via Orange Money ou Wave.'
              : 'It is simple, fast, and 100% secure via Orange Money or Wave transfer.'}
          </p>
        </div>

        {/* Channels */}
        <div className="space-y-3">
          {/* ORANGE MONEY */}
          <div className="bg-black/30 p-4 rounded-xl border border-slate-800 flex items-center justify-between hover:border-orange-500/30 transition-all">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Orange Money</span>
              <span className="text-sm font-mono font-bold text-[#FF7A00]">+221 78 146 64 21</span>
            </div>
            <button 
              onClick={() => handleCopy(numberToCopy, 'om')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all border ${
                copiedText === 'om' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {copiedText === 'om' ? (isFr ? 'Copié ! ✓' : 'Copied! ✓') : '📋 ' + (isFr ? 'Copier' : 'Copy')}
            </button>
          </div>

          {/* WAVE */}
          <div className="bg-black/30 p-4 rounded-xl border border-slate-800 flex items-center justify-between hover:border-blue-500/30 transition-all">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Transfert Wave</span>
              <span className="text-sm font-mono font-bold text-blue-400">+221 78 146 64 21</span>
            </div>
            <button 
              onClick={() => handleCopy(numberToCopy, 'wave')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all border ${
                copiedText === 'wave' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              {copiedText === 'wave' ? (isFr ? 'Copié ! ✓' : 'Copied! ✓') : '📋 ' + (isFr ? 'Copier' : 'Copy')}
            </button>
          </div>
        </div>

        {/* Instructions limit */}
        <p className="text-[10px] italic text-slate-500 mt-2 text-center leading-relaxed">
          {isFr 
            ? 'Après le don, envoie "ALGS" par WhatsApp au même numéro pour recevoir un message de remerciement.'
            : 'After donating, send "ALGS" via WhatsApp to the same number to receive a thank you message.'}
        </p>
      </div>

      {/* Footer Branding */}
      <p className="text-center text-[10px] text-slate-600 font-mono pt-4 border-t border-slate-800/60">
        {isFr ? 'Tout droit réservé • développé par HardSoft Technologies' : 'All rights reserved • developed by HardSoft Technologies'}
      </p>
    </div>
  );
}
