import { TranslationSchema } from '../i18n';

interface AboutPageProps {
  t: TranslationSchema;
}

export default function AboutPage({ t }: AboutPageProps) {
  return (
    <div className="space-y-6 animate-fade-in text-theme-text py-1">
      <h1 className="text-2xl font-extrabold text-orange-400 tracking-tight">{t.about.title}</h1>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-3">
        <h2 className="text-lg font-bold text-orange-300">{t.about.whyTitle}</h2>
        <p className="text-theme-text-secondary leading-relaxed text-sm font-sans">{t.about.whyText}</p>
      </div>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-3">
        <h2 className="text-lg font-bold text-theme-text">{t.about.problemTitle}</h2>
        <ul className="space-y-2.5">
          {t.about.problems.map((p, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-theme-text-secondary items-start">
              <span className="text-red-400 select-none shrink-0 mt-1">•</span>
              <span className="font-sans">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-3">
        <h2 className="text-lg font-bold text-emerald-400">{t.about.solutionTitle}</h2>
        <p className="text-theme-text-secondary leading-relaxed text-sm font-sans">{t.about.solutionText}</p>
      </div>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-3">
        <h2 className="text-lg font-bold text-theme-text">{t.about.forWhoTitle}</h2>
        <div className="flex flex-wrap gap-2.5">
          {t.about.forWho.map((item, i) => (
            <span key={i} className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-xl text-xs font-bold font-mono">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
