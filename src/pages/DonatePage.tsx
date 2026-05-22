import { useState } from 'react';
import { Heart, Copy, CheckCircle2 } from 'lucide-react';
import { TranslationSchema } from '../i18n';

interface DonatePageProps {
  t: TranslationSchema;
}

export default function DonatePage({ t }: DonatePageProps) {
  const [copied, setCopied] = useState(false);

  const copyNumber = () => {
    navigator.clipboard.writeText('+221781466421');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-theme-text py-1">
      <h1 className="text-2xl font-extrabold text-pink-400 flex items-center gap-2 tracking-tight">
        <Heart size={24} className="text-pink-500 fill-pink-500 animate-pulse shrink-0" />
        <span>{t.donate.title}</span>
      </h1>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-3.5">
        <h2 className="text-lg font-bold text-pink-300">{t.donate.whyTitle}</h2>
        <p className="text-theme-text-secondary leading-relaxed text-sm font-sans">{t.donate.whyText}</p>
        <ul className="space-y-2.5 pt-1">
          {t.donate.benefits.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-theme-text-secondary items-start">
              <span className="text-pink-400 select-none font-bold shrink-0">✓</span>
              <span className="font-sans">{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-2">
        <h2 className="text-lg font-bold text-theme-text">{t.donate.howTitle}</h2>
        <p className="text-theme-text-secondary text-sm font-sans">{t.donate.howText}</p>
      </div>

      <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-6 rounded-3xl border border-orange-500/30 space-y-3">
        <h2 className="text-lg font-bold text-orange-400">{t.donate.whereTitle}</h2>
        <div className="flex items-center gap-3 bg-theme-input p-3 rounded-2xl border border-theme-border-thin">
          <p className="text-base sm:text-lg font-bold font-mono text-orange-300 flex-1 select-all">
            {t.donate.number}
          </p>
          <button
            onClick={copyNumber}
            className={`p-3 rounded-xl transition-all duration-300 relative ${
              copied ? 'bg-emerald-600 text-white' : 'bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-orange-300'
            }`}
            title="Copier le numéro"
          >
            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
          </button>
        </div>
        <div className="p-3 bg-orange-500/5 rounded-2xl border border-orange-500/10 text-xs text-theme-text-secondary/80 leading-relaxed font-sans mt-2">
          {t.donate.note}
        </div>
      </div>
    </div>
  );
}
