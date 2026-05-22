import { TranslationSchema } from '../i18n';

interface RoadmapPageProps {
  t: TranslationSchema;
}

export default function RoadmapPage({ t }: RoadmapPageProps) {
  return (
    <div className="space-y-6 animate-fade-in text-theme-text py-1">
      <h1 className="text-2xl font-extrabold text-emerald-400 tracking-tight">{t.roadmap.title}</h1>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-3">
        <h2 className="text-lg font-bold text-emerald-300">{t.roadmap.whyTitle}</h2>
        <p className="text-theme-text-secondary leading-relaxed text-sm font-sans">{t.roadmap.whyText}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-theme-card p-6 rounded-3xl border border-blue-500/20 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">{t.roadmap.freeTitle}</h2>
          <ul className="space-y-2.5">
            {t.roadmap.freeFeatures.map((f, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-theme-text-secondary items-start">
                <span className="text-blue-400 font-bold select-none shrink-0">✓</span>
                <span className="font-sans leading-normal">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-theme-card p-6 rounded-3xl border-emerald-500/20 border space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">{t.roadmap.proTitle}</h2>
          <ul className="space-y-2.5">
            {t.roadmap.proFeatures.map((f, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-theme-text-secondary items-start">
                <span className="text-emerald-400 font-bold select-none shrink-0">★</span>
                <span className="font-sans leading-normal">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-4">
        <h2 className="text-lg font-bold text-theme-text">{t.roadmap.phaseTitle}</h2>
        <div className="space-y-3.5">
          {t.roadmap.phases.map((p, i) => {
            const isCompleted = i === 0; // Current Phase 1 is completed
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 mt-0.5 ${
                  isCompleted ? 'bg-orange-500 text-white' : 'bg-theme-card border border-theme-border text-theme-text-secondary'
                }`}>
                  {i + 1}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${isCompleted ? 'text-theme-text' : 'text-theme-text-secondary opacity-60'}`}>{p}</p>
                  {isCompleted && <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md mt-1 inline-block uppercase">Actif</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
