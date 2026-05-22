import { TranslationSchema } from '../i18n';

interface RoadmapPageProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
}

export default function RoadmapPage({ t, lang }: RoadmapPageProps) {
  const isFr = lang === 'fr';

  return (
    <div className="space-y-6 animate-fade-in text-slate-200 py-1 font-sans">
      {/* Page Title & Subtitle */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-emerald-400">
          {isFr ? "L'avenir d'ALGS – Roadmap" : "The Future of ALGS – Roadmap"}
        </h1>
        <p className="text-xs text-slate-400">
          {isFr ? "L'évolution de notre écosystème logistique pour le Sénégal." : "The development of our logistics ecosystem for Senegal."}
        </p>
      </div>

      {/* Why Monetizing Card */}
      <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-1">
          {isFr ? "Pourquoi ça va devenir payant ?" : "Why will it become paid?"}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          {isFr 
            ? "Pour aller plus loin, il faut une équipe et des serveurs solides. Dans quelques mois, ALGS passera en modèle freemium afin d'assurer l'évolution technologique continue de la plateforme."
            : "To go further, it takes a resilient team and sturdy servers. In a few months, ALGS will move to a freemium model to ensure the persistent technological advancement of the platform."}
        </p>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free Plan */}
        <div className="p-4 bg-slate-900/35 rounded-2xl border border-slate-800 space-y-3 hover:border-blue-500/25 transition-colors">
          <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
            {isFr ? "Gratuit pour toujours" : "Free Forever"}
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="text-blue-400 font-bold select-none">✓</span>
              <span>{isFr ? "Partage de position basique" : "Basic position sharing"}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400 font-bold select-none">✓</span>
              <span>{isFr ? "Ouverture Google Maps" : "Google Maps routing"}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400 font-bold select-none">✓</span>
              <span>{isFr ? "Version client/livreur actuelle" : "Current client/driver application"}</span>
            </li>
          </ul>
        </div>

        {/* Paid Plan */}
        <div className="p-4 bg-[#FF7A00]/5 rounded-2xl border border-[#FF7A00]/20 space-y-3 hover:border-[#FF7A00]/30 transition-colors">
          <h4 className="text-xs font-bold text-[#FF7A00] uppercase tracking-widest">
            {isFr ? "Version Payante – ALGS PRO" : "Paid Version – ALGS PRO"}
          </h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="text-[#FF7A00] font-bold select-none">★</span>
              <span>{isFr ? "Suivi en temps réel de la position" : "Real-time coordinate stream tracking"}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#FF7A00] font-bold select-none">★</span>
              <span>{isFr ? "Historique des livraisons" : "Full delivery history & statistics"}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#FF7A00] font-bold select-none">★</span>
              <span>{isFr ? "Notifications push" : "Push triggers & delivery notifications"}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#FF7A00] font-bold select-none">★</span>
              <span>{isFr ? "Multi-livreurs pour entreprises" : "Fleet management system"}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#FF7A00] font-bold select-none">★</span>
              <span>{isFr ? "Sans pub" : "Ad-free premium interface"}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Timeline of phases */}
      <div className="space-y-3.5 pt-1">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
          {isFr ? "Où en sommes-nous ?" : "Where are we now?"}
        </h3>

        <div className="space-y-5">
          {/* Phase 1 */}
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#FF7A00] text-black text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-white flex flex-wrap items-center gap-2">
                <span>{isFr ? "Phase 1 : App de base fonctionnelle" : "Phase 1: Basic Functional App"}</span>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-black tracking-wider uppercase border border-emerald-500/20">
                  {isFr ? "ACTIF" : "ACTIVE"}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                {isFr 
                  ? "Validation du MVP, système de capture GPS haute fidélité et génération de messages WhatsApp."
                  : "Validation of raw MVP, high fidelity satellite locking algorithm, and instant auto-typed WhatsApp notifications."}
              </p>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-400">
                {isFr ? "Phase 2 : Suivi temps réel en cours" : "Phase 2: Live Tracking Integration"}
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                {isFr 
                  ? "Mise en place de la synchronisation dynamique de la carte pour tracer le déplacement du coursier."
                  : "Establish real-time Map coordinate streaming pipelines to track live position without reloading pages."}
              </p>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-slate-400">
                {isFr ? "Phase 3 : Lancement ALGS Pro pour entreprises" : "Phase 3: Launch ALGS Pro for Enterprises"}
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                {isFr 
                  ? "Ouverture de l'interface SaaS payante pour les boutiques e-commerce et gestionnaires de flottes."
                  : "Direct APIs for online commerce hubs, payment links, and dispatchers."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <p className="text-center text-[10px] text-slate-600 font-mono pt-6 border-t border-slate-800/60">
        {isFr ? 'Tout droit réservé • développé par HardSoft Technologies' : 'All rights reserved • developed by HardSoft Technologies'}
      </p>
    </div>
  );
}
