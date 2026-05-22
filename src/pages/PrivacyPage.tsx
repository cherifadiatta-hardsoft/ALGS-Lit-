import { useState } from 'react';
import { ShieldCheck, EyeOff, ServerCrash, Database, Trash2, ArrowLeft, Check } from 'lucide-react';
import { TranslationSchema } from '../i18n';

interface PrivacyPageProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
  onBackToHome?: () => void;
}

export default function PrivacyPage({ t, lang, onBackToHome }: PrivacyPageProps) {
  const isFr = lang === 'fr';

  return (
    <div className="space-y-6 animate-fade-in text-slate-200 py-1">
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider select-none">
          {isFr ? '🛡️ Données 100% Locales' : '🛡️ 100% On-Device Data'}
        </span>
        {onBackToHome && (
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs text-[#FF7A00] hover:text-orange-400 transition-colors font-bold font-sans"
          >
            <ArrowLeft size={14} />
            <span>{isFr ? 'Retour' : 'Back'}</span>
          </button>
        )}
      </div>

      {/* Main Title Banner */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-white">
          {isFr ? 'Charte de Confidentialité' : 'Privacy Policy'}
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          {isFr 
            ? 'Chez ALGS Live, votre vie privée n’est pas une option, c’est notre priorité absolue. Notre architecture est conçue selon le principe du Privacy by Design : nous ne collectons que le strict nécessaire pour réussir votre livraison.'
            : 'At ALGS Live, your privacy is not an option—it is our absolute priority. Our architecture is designed around the Privacy by Design principle: we only collect the strict minimum required to successfully complete your delivery.'}
        </p>
      </div>

      {/* Structured Info Block (No Backend) */}
      <div className="p-4 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-2">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
          <Check size={16} className="text-emerald-400 shrink-0" />
          {isFr ? '✅ Pas de backend, pas de tracking' : '✅ No backend, no tracking'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {isFr
            ? 'ALGS Live fonctionne sans aucune base de données centrale. Vos coordonnées GPS précises ne transitent par aucun serveur intermédiaire tiers et ne sont jamais stockées à distance. Tout se passe en local sur votre appareil.'
            : 'ALGS Live runs without any central database. Your precise GPS coordinates do not transit through any third-party intermediate server and are never stored remotely. Everything happens locally on your device.'}
        </p>
      </div>

      {/* Grid containing policy sections */}
      <div className="grid grid-cols-1 gap-4">
        {/* Section 1 */}
        <div className="p-4 bg-slate-900/50 rounded-2.5xl border border-slate-800 space-y-2 hover:border-orange-500/20 transition-all">
          <h3 className="text-sm font-bold text-[#FF7A00] flex items-center gap-2">
            <EyeOff size={16} className="text-[#FF7A00] shrink-0" />
            {isFr ? '📍 1. Utilisation de la géolocalisation' : '📍 1. Geolocation Usage'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {isFr
              ? "Votre position géographique exacte est calculée en temps réel uniquement au moment précis où vous cliquez sur le bouton de partage. Dès que l'application WhatsApp s'ouvre, la demande de localisation s'arrête instantanément."
              : "Your exact GPS position is computed in real time only at the precise moment you click the share button. Once the WhatsApp application opens, the location request stops instantly."}
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-4 bg-slate-900/50 rounded-2.5xl border border-slate-800 space-y-2 hover:border-blue-500/20 transition-all">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
            <Database size={16} className="text-blue-400 shrink-0" />
            {isFr ? '💾 2. Stockage des numéros de téléphone' : '💾 2. Storing Phone Numbers'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {isFr
              ? "Pour vous éviter de ressaisir vos informations à chaque course, vos numéros WhatsApp (client et livreur) sont enregistrés exclusivement dans le stockage local (LocalStorage) de votre propre téléphone. Aucun tiers n'y a accès."
              : "To avoid having to re-type your information for each delivery, your WhatsApp numbers (client and driver) are saved exclusively in the local storage (LocalStorage) of your own phone. No third party has access."}
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-4 bg-slate-900/50 rounded-2.5xl border border-slate-800 space-y-2 hover:border-purple-500/20 transition-all">
          <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <ServerCrash size={16} className="text-purple-400 shrink-0" />
            {isFr ? '🔗 3. Absence de serveurs de données' : '🔗 3. No Data Servers'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {isFr
              ? "Nous n'opérons aucune base de données utilisateurs. Toutes les transmissions se font directement via des liens profonds (deep links) vers les services officiels de WhatsApp et Google Maps de votre périphérique."
              : "We do not run any user database. All transmissions are processed directly via deep links to official WhatsApp and Google Maps services on your device."}
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-4 bg-slate-900/50 rounded-2.5xl border border-slate-800 space-y-2 hover:border-amber-500/20 transition-all">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Trash2 size={16} className="text-amber-400 shrink-0" />
            {isFr ? '🗑️ 4. Contrôle total de vos données' : '🗑️ 4. Full Control Over Your Data'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {isFr
              ? "Vous pouvez purger instantanément l'historique des partages ainsi que vos numéros mémorisés en utilisant les boutons d'effacement prévus dans l'application, ou en vidant le cache de votre navigateur."
              : "You can instantly purge your sharing history as well as your saved numbers using the clean buttons provided in the application, or by clearing your browser cache."}
          </p>
        </div>
      </div>

      {/* Engagement Block */}
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl border-l-4 border-[#FF7A00]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF7A00] mb-1">
          {isFr ? 'Engagement Transparent' : 'Transparent Commitment'}
        </h4>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          {isFr
            ? "ALGS Live respecte les principes fondamentaux de la confidentialité dès la conception. Notre modèle n'implique aucune annonce publicitaire intrusive, aucun traceur analytique, et aucune forme de monétisation de vos données."
            : "ALGS Live strictly adheres to the core concepts of Privacy by Design. We implement absolutely zero intrusive ad payloads, zero behavioral tracker hooks, and zero user profile selling."}
        </p>
      </div>

      {/* Footer Branding */}
      <p className="text-center text-[10px] text-slate-600 font-mono pt-4 border-t border-slate-800/60">
        {isFr ? 'Tout droit réservé • développé par HardSoft Technologies' : 'All rights reserved • developed by HardSoft Technologies'}
      </p>
    </div>
  );
}
