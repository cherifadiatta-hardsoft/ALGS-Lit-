import { ShieldCheck, EyeOff, ServerCrash, Database, Smartphone, Trash2, ArrowLeft } from 'lucide-react';
import { TranslationSchema } from '../i18n';

interface PrivacyPageProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
  onBackToHome?: () => void;
}

export default function PrivacyPage({ t, lang, onBackToHome }: PrivacyPageProps) {
  const content = {
    fr: {
      title: "Charte de Confidentialité",
      subtitle: "Votre vie privée est notre priorité absolue. ALGS Live est conçu avec un respect total de vos données personnelles.",
      badge: "Données 100% Locales",
      
      introTitle: "Pas de backend, pas de tracking",
      introText: "ALGS Live est une application sans base de données centrale. Vos coordonnées GPS ne transitent par aucun serveur intermédiaire et ne sont jamais stockées à distance.",
      
      sections: [
        {
          id: "gps",
          title: "1. Utilisation de la géolocalisation",
          icon: <EyeOff size={20} className="text-orange-400" />,
          text: "Votre position GPS est calculée en temps réel au niveau de votre navigateur via l'API HTML5 Geolocation. Ce calcul n'intervient qu'au moment précis où vous cliquez sur le bouton de partage."
        },
        {
          id: "storage",
          title: "2. Stockage des numéros de téléphone",
          icon: <Database size={20} className="text-emerald-400" />,
          text: "Vos numéros WhatsApp (client et livreur) sont enregistrés exclusivement dans le stockage local (LocalStorage) de votre propre téléphone. Aucun tiers, pas même l'équipe de développement d'ALGS, n'a accès à ces données."
        },
        {
          id: "no-server",
          title: "3. Absence de serveurs de données",
          icon: <ServerCrash size={20} className="text-pink-400" />,
          text: "Nous n'opérons aucune base de données utilisateurs. Toutes les transmissions se font directement via des liens profonds (deep links) vers les services officiels de WhatsApp et Google Maps de périphérique à périphérique."
        },
        {
          id: "control",
          title: "4. Contrôle total de vos données",
          icon: <Trash2 size={20} className="text-blue-400" />,
          text: "Vous pouvez purger instantanément l'historique des partages ainsi que vos numéros mémorisés en utilisant les boutons d'effacement prévus dans l'application, ou en vidant le cache de votre navigateur."
        }
      ],
      
      conclusionTitle: "Engagement Transparent",
      conclusionText: "ALGS Live respecte les principes fondamentaux de la confidentialité dès la conception (Privacy by Design). Notre modèle n'implique aucune annonce publicitaire intrusive, aucun traceur analytique, et aucune forme de monétisation de vos données."
    },
    en: {
      title: "Privacy Policy",
      subtitle: "Your privacy is our absolute priority. ALGS Live is secure-by-default and respects your personal coordinates.",
      badge: "100% On-Device Data",
      
      introTitle: "Zero Backend, Zero Tracking",
      introText: "ALGS Live is an offline-friendly tool without central databases. Your physical coordinates never touch any intermediate server and are never uploaded remotely.",
      
      sections: [
        {
          id: "gps",
          title: "1. Geolocation Usage",
          icon: <EyeOff size={20} className="text-orange-400" />,
          text: "Your GPS coordinates are computed entirely on-device using the native HTML5 Geolocation API. Location tracking is only triggered exactly when you choose to click the sharing button."
        },
        {
          id: "storage",
          title: "2. Local Telephone Storage",
          icon: <Database size={20} className="text-emerald-400" />,
          text: "Your WhatsApp phone numbers are stored strictly within your browser's LocalStorage on your own device. No third party (including ALGS creators) can ever inspect or extract this info."
        },
        {
          id: "no-server",
          title: "3. Non-Custodial Infrastructure",
          icon: <ServerCrash size={20} className="text-pink-400" />,
          text: "We run no data collecting backends. Geolocation transmission leverages encrypted point-to-point application linkages directly to standard WhatsApp chat APIs and Google Maps redirects."
        },
        {
          id: "control",
          title: "4. Total Custody & Erasure",
          icon: <Trash2 size={20} className="text-blue-400" />,
          text: "You retain full ownership of your logs. You can permanently wipe your share history or cleared numbers instantly via our in-app clear triggers or directly via your web browser settings."
        }
      ],
      
      conclusionTitle: "Transparent Commitment",
      conclusionText: "ALGS Live strictly adheres to the core concepts of Privacy by Design. We implement absolutely zero intrusive ad payloads, zero behavioral tracker hooks, and zero user profile selling."
    }
  };

  const current = content[lang] || content.en;

  return (
    <div className="space-y-6 animate-fade-in text-theme-text py-1">
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider select-none">
          🛡️ {current.badge}
        </span>
        {onBackToHome && (
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors font-bold font-sans"
          >
            <ArrowLeft size={14} />
            <span>{lang === 'fr' ? 'Retour' : 'Back'}</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-theme-text">{current.title}</h1>
        <p className="text-theme-text-secondary text-sm leading-relaxed">{current.subtitle}</p>
      </div>

      {/* Main Container Card */}
      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-4">
        <div className="flex items-center gap-2.5 pb-2.5 border-b border-theme-border-thin">
          <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
          <h2 className="text-base font-bold text-theme-text">{current.introTitle}</h2>
        </div>
        <p className="text-sm text-theme-text-secondary leading-relaxed font-sans">{current.introText}</p>
      </div>

      {/* Structured Sections */}
      <div className="grid grid-cols-1 gap-4">
        {current.sections.map((section) => (
          <div key={section.id} className="bg-theme-card p-5 rounded-2.5xl border border-theme-border-thin space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="shrink-0">{section.icon}</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-theme-text-secondary">{section.title}</h3>
            </div>
            <p className="text-xs text-theme-text-muted leading-relaxed font-sans pl-7">{section.text}</p>
          </div>
        ))}
      </div>

      {/* Closing Card */}
      <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-6 rounded-3xl border border-orange-500/20 space-y-2.5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-orange-300">{current.conclusionTitle}</h3>
        <p className="text-xs text-theme-text-secondary leading-relaxed font-sans">
          {current.conclusionText}
        </p>
      </div>
    </div>
  );
}
