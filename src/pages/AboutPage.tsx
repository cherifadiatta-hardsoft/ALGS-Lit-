import { TranslationSchema } from '../i18n';

interface AboutPageProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
}

export default function AboutPage({ t, lang }: AboutPageProps) {
  const isFr = lang === 'fr';

  return (
    <div className="space-y-6 animate-fade-in text-slate-200 py-1 font-sans">
      {/* Page Title & Tagline */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white">
          {isFr ? 'ALGS Live – Livrez sans vous perdre' : 'ALGS Live – Deliver without getting lost'}
        </h1>
        <p className="text-xs uppercase tracking-widest text-[#FF7A00] font-black">
          {isFr ? 'La bonne livraison, au bon endroit.' : 'The right delivery, at the right place.'}
        </p>
      </div>

      <div className="space-y-5">
        {/* Why ALGS */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isFr ? 'Pourquoi on a créé ALGS' : 'Why we created ALGS'}
          </h2>
          <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFr ? (
                <>
                  Aujourd'hui, au Sénégal, <strong>8 livreurs sur 10 perdent du temps</strong> à appeler le client pour trouver l'adresse exacte. Ce manque d'adressage précis engendre des retards constants, des colis égarés et des clients énervés.
                </>
              ) : (
                <>
                  Today, in Senegal, <strong>8 out of 10 delivery drivers waste time</strong> calling the customer to find their exact address. This lack of precise addressing causes constant delays, lost packages, and frustrated customers.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Problems */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isFr ? 'Le problème constaté' : 'The observed obstacles'}
          </h2>
          <ul className="space-y-2.5 bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
            <li className="text-xs text-slate-400 flex items-start gap-2">
              <span className="text-red-500 font-bold select-none">•</span>
              <span>
                {isFr 
                  ? 'Le client ne sait pas toujours expliquer précisément où il habite.' 
                  : 'The customer does not always know how to precisely explain where they live.'}
              </span>
            </li>
            <li className="text-xs text-slate-400 flex items-start gap-2">
              <span className="text-red-500 font-bold select-none">•</span>
              <span>
                {isFr 
                  ? 'Le livreur doit se repérer avec des repères de quartier qui changent tout le temps.' 
                  : 'The driver has to navigate using neighborhood landmarks that change constantly.'}
              </span>
            </li>
            <li className="text-xs text-slate-400 flex items-start gap-2">
              <span className="text-red-500 font-bold select-none">•</span>
              <span>
                {isFr 
                  ? "Les appels répétés coûtent énormément de temps et d'argent en crédit téléphonique." 
                  : 'Repeated calls cost an enormous amount of time and mobile credit.'}
              </span>
            </li>
            <li className="text-xs text-slate-400 flex items-start gap-2">
              <span className="text-red-500 font-bold select-none">•</span>
              <span>
                {isFr 
                  ? "Il n'y a pas de suivi en temps réel simple pour rassurer le client." 
                  : 'There is no simple real-time tracking to reassure the customer.'}
              </span>
            </li>
          </ul>
        </div>

        {/* Solution */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isFr ? 'La solution ALGS' : 'The ALGS solution'}
          </h2>
          <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all">
            <p className="text-xs text-slate-300 leading-relaxed">
              {isFr
                ? "ALGS Live règle ça en 1 clic. Le client partage sa position GPS exacte via WhatsApp. Le livreur reçoit instantanément un lien universel Google Maps et suit l'itinéraire direct en mode navigation moto ou voiture."
                : "ALGS Live resolves this in 1 click. The customer shares their exact GPS location via WhatsApp. The driver instantly receives a universal Google Maps link and follows the direct route in motorcycle or car navigation mode."}
            </p>
          </div>
        </div>

        {/* Target Audience */}
        <div className="space-y-2 block">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {isFr ? 'Pour qui ?' : 'For who?'}
          </h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {(isFr 
              ? ['Particuliers', 'Livreurs indépendants', 'Petites entreprises, boutiques en ligne']
              : ['Individuals', 'Independent delivery riders', 'Small businesses, online shops']
            ).map((tag, idx) => (
              <span 
                key={idx} 
                className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium px-3.5 py-1.5 rounded-xl hover:text-white transition-colors"
              >
                {tag}
              </span>
            ))}
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
