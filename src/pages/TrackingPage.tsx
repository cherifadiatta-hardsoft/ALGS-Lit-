import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  Compass, 
  ExternalLink, 
  Smartphone, 
  Truck, 
  Info, 
  Navigation,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCw,
  PhoneCall,
  Pause,
  Play
} from 'lucide-react';
import { getShareRecord, subscribeToShareUpdates, ShareLocation, updateShareStatus } from '../utils/supabase';
import { createGoogleMapsLink } from '../utils/geolocation';

interface TrackingPageProps {
  shareId: string;
  lang: 'fr' | 'en';
  onBackToHome: () => void;
}

export default function TrackingPage({ shareId, lang, onBackToHome }: TrackingPageProps) {
  const [share, setShare] = useState<ShareLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const loadShare = async () => {
      setLoading(true);
      setError('');
      try {
        const record = await getShareRecord(shareId);
        if (record) {
          setShare(record);
          
          if (isStreamingActive) {
            // Subscribe to real-time changes
            unsubscribe = subscribeToShareUpdates(shareId, (updatedRecord) => {
              setShare(updatedRecord);
            });
          }
        } else {
          setError(
            lang === 'fr' 
              ? 'Lien de partage introuvable ou expiré.' 
              : 'Tracking link not found or expired.'
          );
        }
      } catch (err) {
        console.error(err);
        setError(
          lang === 'fr' 
            ? 'Erreur lors du chargement des données. Veuillez vérifier vos clés Supabase.' 
            : 'Error fetching tracking details. Please configure your Supabase keys.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (!share) {
      loadShare();
    } else {
      if (isStreamingActive) {
        unsubscribe = subscribeToShareUpdates(shareId, (updatedRecord) => {
          setShare(updatedRecord);
        });
      }
    }

    return () => {
      unsubscribe();
    };
  }, [shareId, lang, isStreamingActive]);

  const handleUpdateStatus = async (newStatus: 'pending' | 'delivered' | 'canceled') => {
    if (!share) return;
    setUpdatingStatus(true);
    try {
      const success = await updateShareStatus(share.id, newStatus);
      if (success) {
        setShare({ ...share, status: newStatus });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RotateCw className="animate-spin text-orange-500" size={36} />
        <p className="text-sm text-theme-text-secondary font-mono">
          {lang === 'fr' ? 'Connexion en temps réel à Supabase...' : 'Connecting to Supabase in real-time...'}
        </p>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border text-center space-y-6 max-w-md mx-auto py-10 shadow-2xl">
        <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center text-red-400 mx-auto border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-theme-text">
            {lang === 'fr' ? 'Impossible de suivre' : 'Unable to Track'}
          </h3>
          <p className="text-sm text-theme-text-secondary leading-relaxed">
            {error || (lang === 'fr' ? 'Aucune donnée de localisation disponible.' : 'No location data found.')}
          </p>
        </div>
        
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl text-xs text-orange-300 space-y-1.5 leading-relaxed text-left">
          <p className="font-bold flex items-center gap-1.5">
            <Info size={14} className="shrink-0" />
            {lang === 'fr' ? 'Note pour le développeur :' : 'Note for the Developer:'}
          </p>
          <p>
            {lang === 'fr' 
              ? 'Pour activer le suivi en direct, assurez-vous d’avoir configuré la variable d’environnement VITE_SUPABASE_ANON_KEY avec votre clé publique anonyme de Supabase.'
              : 'To enable real-time tracking, ensure you have configured VITE_SUPABASE_ANON_KEY in your environment.'}
          </p>
        </div>

        <button
          onClick={onBackToHome}
          className="w-full bg-theme-input hover:bg-theme-card-hover border border-theme-border font-bold py-3.5 px-6 rounded-2xl transition-all"
        >
          {lang === 'fr' ? "Retour à l'accueil" : "Go to Homepage"}
        </button>
      </div>
    );
  }

  const { latitude: lat, longitude: lng, type, sender_phone, recipient_phone, accuracy, status, created_at, note } = share;
  const mapsLink = createGoogleMapsLink(lat, lng);
  const timestampString = new Date(created_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate bbox bounding grid for OpenStreetMap frame
  const delta = 0.003; // ~300 meters view depth
  const bbox = `${lng-delta}%2C${lat-delta}%2C${lng+delta}%2C${lat+delta}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  const isClient = type === 'client';

  return (
    <div className="space-y-6 animate-fade-in text-theme-text">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="text-xs font-bold text-orange-500 hover:text-orange-400 font-mono transition-colors tracking-widest flex items-center gap-1"
        >
          ← {lang === 'fr' ? "RETOUR" : "BACK"}
        </button>
        <span className={`text-[10px] font-mono px-3 py-1 border rounded-lg uppercase tracking-wider font-bold transition-all ${
          isStreamingActive
            ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20'
            : 'text-amber-400 bg-amber-500/5 border-amber-500/20'
        }`}>
          {isStreamingActive 
            ? (lang === 'fr' ? 'LIVE ACTIF' : 'LIVE ACTIVE') 
            : (lang === 'fr' ? 'LIVE EN PAUSE' : 'LIVE PAUSED')}
        </span>
      </div>

      {/* Primary Tracking Details Card */}
      <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md space-y-6">
        {/* Glow backdrop indicator */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] pointer-events-none -mr-16 -mt-16 ${
          isClient ? 'bg-orange-500/[0.15]' : 'bg-emerald-500/[0.15]'
        }`} />

        {/* Header Information representing the share */}
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl border ${
            isClient 
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {isClient ? <Smartphone size={28} /> : <Truck size={28} />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black tracking-tight">
              {isClient 
                ? (lang === 'fr' ? "Position Client (Livraison)" : "Client Delivery Position")
                : (lang === 'fr' ? "Position Livreur (En route)" : "Driver GPS Location")}
            </h2>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3.5 text-xs text-theme-text-secondary mt-1">
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-theme-text-muted" /> {timestampString}
              </span>
              <span className="text-theme-text-muted/40">•</span>
              <span className="flex items-center gap-1 font-mono text-theme-text-success">
                <Compass size={13} className="text-theme-text-muted animate-spin-slow" /> ±{Math.round(accuracy)}m
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Status Badges and actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-theme-input p-4 rounded-2xl border border-theme-border-thin">
          <div className="md:col-span-2 flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full animate-ping shrink-0 ${
              status === 'pending' 
                ? (isClient ? 'bg-orange-500' : 'bg-emerald-500') 
                : status === 'delivered' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div>
              <p className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider leading-none">
                {lang === 'fr' ? "STATUT DE LA COURSE" : "DELIVERY STATUS"}
              </p>
              <p className="text-sm font-bold text-theme-text mt-1">
                {status === 'pending' && (lang === 'fr' ? "En cours de livraison / En route" : "En Route / Active Share")}
                {status === 'delivered' && (lang === 'fr' ? "📍 Livré / Arrivé à destination" : "📍 Safely Delivered")}
                {status === 'canceled' && (lang === 'fr' ? "Annulé / Suspendu" : "Canceled / Suspended")}
              </p>
            </div>
          </div>

          {/* Quick toggle actions if they want to update status manually (convenient for driver) */}
          <div className="flex items-center md:justify-end gap-1.5">
            <button
              onClick={() => handleUpdateStatus('delivered')}
              disabled={updatingStatus || status === 'delivered'}
              className="p-2.5 bg-green-500/10 hover:bg-green-500/25 disabled:opacity-40 rounded-xl text-green-400 border border-green-500/20 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
              title={lang === 'fr' ? "Marquer comme Livré" : "Mark as Delivered"}
            >
              <CheckCircle2 size={16} />
              <span className="md:hidden">{lang === 'fr' ? "Livré" : "Delivered"}</span>
            </button>
            <button
              onClick={() => handleUpdateStatus('canceled')}
              disabled={updatingStatus || status === 'canceled'}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/25 disabled:opacity-40 rounded-xl text-red-400 border border-red-500/20 transition-all text-xs font-bold flex items-center justify-center gap-1.5"
              title={lang === 'fr' ? "Annuler la course" : "Cancel"}
            >
              <XCircle size={16} />
              <span className="md:hidden">{lang === 'fr' ? "Annuler" : "Cancel"}</span>
            </button>
          </div>
        </div>

        {/* Embedded Interactive Map Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
              {lang === 'fr' ? "Carte Interactive ALGS" : "ALGS Interactive Web Map"}
            </label>
            
            {/* User-controlled Real-Time location streaming toggle */}
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isStreamingActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <button
                type="button"
                onClick={() => setIsStreamingActive(!isStreamingActive)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-lg border font-mono transition-all duration-200 outline-none select-none ${
                  isStreamingActive 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                }`}
                title={isStreamingActive ? (lang === 'fr' ? "Mettre en pause le flux" : "Pause live updates") : (lang === 'fr' ? "Reprendre le flux" : "Resume live updates")}
              >
                {isStreamingActive ? (
                  <>
                    <Pause size={10} className="shrink-0" />
                    <span>{lang === 'fr' ? 'PAUSER' : 'PAUSE'}</span>
                  </>
                ) : (
                  <>
                    <Play size={10} className="shrink-0" />
                    <span>{lang === 'fr' ? 'REPRENDRE' : 'RESUME'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="w-full h-80 rounded-2xl overflow-hidden border border-theme-border relative shadow-lg bg-theme-input">
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              referrerPolicy="no-referrer"
              title="OpenStreetMap Tracker"
              className="opacity-90 hover:opacity-100 transition-opacity"
            />
            {/* Embedded coordinate reference tag */}
            <div className="absolute bottom-3 left-3 bg-theme-card/90 border border-theme-border px-3 py-1.5 rounded-xl font-mono text-[10px] space-y-0.5 pointer-events-none drop-shadow-md backdrop-blur-md">
              <p className="text-theme-text-secondary">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
            </div>
          </div>
        </div>

        {/* Notes and Phone numbers details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-theme-input p-4.5 rounded-2xl border border-theme-border-thin space-y-1.5">
            <p className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
              {lang === 'fr' ? "NUMÉROS DE CONTACT" : "CONTACT INFORMATION"}
            </p>
            <div className="space-y-1 text-sm font-mono">
              <p className="flex justify-between">
                <span className="text-theme-text-secondary">{isClient ? 'Client' : (lang === 'fr' ? 'Livreur' : 'Driver')} :</span>
                <span className="text-theme-text font-semibold flex items-center gap-1">
                  +{sender_phone}
                  <a href={`tel:+${sender_phone}`} className="text-orange-400 hover:text-orange-300 p-0.5">
                    <PhoneCall size={13} />
                  </a>
                </span>
              </p>
              <p className="flex justify-between">
                <span className="text-theme-text-secondary">{isClient ? (lang === 'fr' ? 'Envoi à / Receveur' : 'Sending to') : 'Client'} :</span>
                <span className="text-theme-text font-semibold flex items-center gap-1">
                  +{recipient_phone}
                  <a href={`tel:+${recipient_phone}`} className="text-orange-400 hover:text-orange-300 p-0.5">
                    <PhoneCall size={13} />
                  </a>
                </span>
              </p>
            </div>
          </div>

          <div className="bg-theme-input p-4.5 rounded-2xl border border-theme-border-thin flex flex-col justify-start space-y-1.5">
            <p className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
              {lang === 'fr' ? "MESSAGE / INSTRUCTIONS" : "NOTES & DIRECTIONS"}
            </p>
            <p className="text-xs text-theme-text-secondary leading-relaxed italic">
              {note ? `"${note}"` : (lang === 'fr' ? "Aucun commentaire additionnel rédigé par l'expéditeur." : "No additional instructions wrote by the sender.")}
            </p>
          </div>
        </div>

        {/* Big Navigation Buttons */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
            {lang === 'fr' ? "Lancer une application GPS Externe" : "Open in External GPS Navigator"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 leading-normal text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-98"
            >
              <Navigation size={16} />
              <span>Google Maps Navigation</span>
              <ExternalLink size={12} className="text-orange-100" />
            </a>
            
            <a
              href={`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-450 leading-normal text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-98"
            >
              <Compass size={16} />
              <span>Waze GPS Tracker</span>
              <ExternalLink size={12} className="text-sky-100" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
