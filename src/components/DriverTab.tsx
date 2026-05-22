import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Truck, 
  Compass, 
  History, 
  Phone,
  ExternalLink,
  AlertTriangle,
  X
} from 'lucide-react';
import { getCurrentPosition, createGoogleMapsLink, GeolocationResult, GeolocationError } from '../utils/geolocation';
import { createWhatsAppLink, isValidInternationalPhone, formatPhoneForWhatsApp } from '../utils/whatsapp';
import { TranslationSchema } from '../i18n';
import { createShareRecord, updateShareCoordinates } from '../utils/supabase';


interface HistoryItem {
  id: string;
  timestamp: number;
  clientPhone: string;
  latitude: number;
  longitude: number;
  mapsLink: string;
}

interface DriverTabProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
}

export default function DriverTab({ t, lang }: DriverTabProps) {
  const [driverPhone, setDriverPhone] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationDetails, setLocationDetails] = useState<GeolocationResult | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [lastBroadcastTime, setLastBroadcastTime] = useState<Date | null>(null);
  const [autoClear, setAutoClear] = useState<boolean>(() => {
    const saved = localStorage.getItem('algs_auto_clear_after_share');
    return saved ? saved === 'true' : true;
  });

  // Passive background tracking updates every 20s if sharing is active
  useEffect(() => {
    if (!activeShareId || !isBroadcasting) return;

    const interval = setInterval(async () => {
      try {
        const position = await getCurrentPosition(10000);
        setLocationDetails(position);
        await updateShareCoordinates(
          activeShareId,
          position.latitude,
          position.longitude,
          position.accuracy
        );
        setLastBroadcastTime(new Date());
      } catch (err) {
        console.error("Background location update failed:", err);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [activeShareId, isBroadcasting]);

  // Resource capacity manager: auto-stop broadcasting after 15 minutes of inactivity to save bandwidth & driver battery
  useEffect(() => {
    if (!isBroadcasting) return;

    const timeout = setTimeout(() => {
      setIsBroadcasting(false);
    }, 15 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [isBroadcasting]);

  // Load saved configurations
  useEffect(() => {
    const savedDriver = localStorage.getItem('algs_driver_phone');
    const savedClient = localStorage.getItem('algs_client_phone_recipient');
    if (savedDriver) setDriverPhone(savedDriver);
    if (savedClient) setClientPhone(savedClient);

    // Load driver history
    const savedHistory = localStorage.getItem('algs_driver_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save driver phone to localStorage on blur
  const handleSaveDriverPhone = () => {
    localStorage.setItem('algs_driver_phone', driverPhone);
  };

  // Save client phone to localStorage on change/blur
  const handleSaveClientPhone = () => {
    localStorage.setItem('algs_client_phone_recipient', clientPhone);
  };

  const handleShareLocation = async () => {
    setError('');
    setSuccess('');
    setLocationDetails(null);
    setAccuracyWarning(null);

    if (!clientPhone.trim()) {
      setError(t.home.driver.error);
      return;
    }

    if (!isValidInternationalPhone(clientPhone)) {
      setError(
        lang === 'fr' 
          ? 'Format de numéro invalide. Assurez-vous d’entrer l’indicatif complet sans le signe "+" (ex: 221771234567).' 
          : 'Invalid phone format. Please enter country code without "+" symbols (ex: 221771234567).'
      );
      return;
    }

    setLoading(true);

    try {
      // Step 1: Query driver's current coordinates
      const position = await getCurrentPosition();
      setLocationDetails(position);

      const lat = position.latitude;
      const lng = position.longitude;
      const mapsLink = createGoogleMapsLink(lat, lng);

      if (position.accuracy > 100) {
        setAccuracyWarning(
          lang === 'fr'
            ? `Attention : Votre précision GPS de ±${Math.round(position.accuracy)} mètres est faible (supérieure à 100 mètres). La localisation obtenue pourrait être imprécise. Nous vous suggérons de vous déplacer vers un espace ouvert en extérieur pour un meilleur calibrage avant de partager.`
            : `Warning: Your GPS accuracy of ±${Math.round(position.accuracy)} meters is low (above 100 meters). The location obtained may be inaccurate. We suggest moving to an open outdoor space for a better calibration before sharing.`
        );
      }

      // Step 2: Try creating Supabase Share Record for online live tracking
      const shareId = await createShareRecord({
        type: 'driver',
        sender_phone: driverPhone || 'Driver',
        recipient_phone: clientPhone,
        latitude: lat,
        longitude: lng,
        accuracy: position.accuracy,
      });

      // Step 3: Formulate message
      const timestampLabel = new Date(position.timestamp).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const appUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;
      const trackingPageLink = shareId ? `${appUrl}/?track=${shareId}` : '';

      const message = lang === 'fr'
        ? `🚚 *ALGS - Suivi du Livreur*\n\nBonjour ! Je suis en route pour votre livraison. Voici ma position actuelle en temps réel (${timestampLabel}) :\n${mapsLink}${trackingPageLink ? `\n\n📡 *Suivi en Temps Réel ALGS Live* (Recommandé) :\n${trackingPageLink}` : ''}\n\n_Suivez mon itinéraire en ouvrant de préférence le lien en direct._`
        : `🚚 *ALGS - Driver Tracker*\n\nHello! I am on my way with your delivery. Here is my current real-time GPS position (${timestampLabel}) :\n${mapsLink}${trackingPageLink ? `\n\n📡 *ALGS Real-Time Live Tracking* (Recommended) :\n${trackingPageLink}` : ''}\n\n_Track my live route by opening the live tracker link._`;

      // Step 4: Formulate deep link with client's phone
      const waLink = createWhatsAppLink(clientPhone, message);

      // Save credentials for reuse
      handleSaveClientPhone();
      if (driverPhone) {
        handleSaveDriverPhone();
      }

      // Step 5: Record to local history logs
      const newItem: HistoryItem = {
        id: shareId || Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        clientPhone: clientPhone,
        latitude: lat,
        longitude: lng,
        mapsLink: trackingPageLink || mapsLink
      };
      const updatedHistory = [newItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('algs_driver_history', JSON.stringify(updatedHistory));

      if (shareId) {
        setActiveShareId(shareId);
        setIsBroadcasting(true);
        setLastBroadcastTime(new Date());
      }

      setSuccess(
        lang === 'fr'
          ? `Position GPS acquise avec succès (Précision ±${Math.round(position.accuracy)}m). Lancement de WhatsApp en cours...`
          : `GPS position successfully acquired (Accuracy ±${Math.round(position.accuracy)}m). Redirecting to WhatsApp...`
      );

      // Step 5: Redirect to target WhatsApp Chat
      setTimeout(() => {
        window.open(waLink, '_blank');
        if (autoClear) {
          // Vidange de sécurité instantanée pour libérer le cache et protéger la confidentialité multi-utilisateurs
          setClientPhone('');
          localStorage.removeItem('algs_client_phone_recipient');
          setLocationDetails(null);
        }
      }, 800);

    } catch (err: any) {
      if (err instanceof GeolocationError) {
        setError(err.message);
      } else {
        setError(t.home.driver.gpsError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Warning indicators for numbers
  const isClientPhoneValid = !clientPhone.trim() || isValidInternationalPhone(clientPhone);
  const showPhoneFormatWarning = clientPhone.trim().length > 0 && !isClientPhoneValid;

  return (
    <div className="space-y-6 animate-fade-in text-theme-text">
      {/* Accuracy Warning Toast */}
      {accuracyWarning && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-theme-card border border-orange-500/40 p-4 rounded-2xl flex items-start gap-3.5 shadow-[0_20px_50px_rgba(249,115,22,0.15)] z-50 animate-fade-in backdrop-blur-xl">
          <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20 text-orange-400 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 space-y-1">
            <h5 className="font-bold text-xs text-orange-300 uppercase tracking-wider">
              {lang === 'fr' ? 'Précision Minimale non atteinte' : 'Low Accuracy Warning'}
            </h5>
            <p className="text-xs text-theme-text-secondary leading-relaxed font-sans">{accuracyWarning}</p>
          </div>
          <button 
            onClick={() => setAccuracyWarning(null)}
            className="text-theme-text-muted hover:text-theme-text transition-colors p-1"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Dynamic Header Badge */}
      <div className="bg-emerald-600/10 border border-emerald-500/30 px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in">
        <Truck className="text-emerald-400 shrink-0" size={24} />
        <div>
          <h4 className="font-semibold text-emerald-300 text-sm">{t.home.driverTab}</h4>
          <p className="text-xs text-theme-text-secondary leading-normal">
            {lang === 'fr'
              ? 'Transmettez votre position GPS au client pendant la course pour lui permettre de vous suivre.'
              : 'Share your live GPS tracker with safety maps directly to the client while delivering packages.'}
          </p>
        </div>
      </div>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-5 shadow-2xl backdrop-blur-md">
        <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
          <Compass className="text-emerald-500 animate-pulse" size={20} />
          {t.home.driver.title}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DRIVER PHONE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
                {t.home.driver.myPhone}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-theme-text-muted text-sm font-mono">+</span>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  onBlur={handleSaveDriverPhone}
                  placeholder="221781234567"
                  className="w-full pl-8 pr-4 py-3 bg-theme-input rounded-2xl border border-theme-border text-theme-text placeholder-theme-text-muted/60 font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-theme-text-muted">
                {lang === 'fr' 
                  ? 'Permet de mémoriser votre numéro sur cet appareil.' 
                  : 'Saves your driver phone number on this local device.'}
              </p>
            </div>

            {/* CLIENT PHONE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
                {t.home.driver.clientPhone} <span className="text-emerald-400 font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-theme-text-muted text-sm font-mono">+</span>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  onBlur={handleSaveClientPhone}
                  placeholder="221771234567"
                  className="w-full pl-8 pr-12 py-3.5 bg-theme-input rounded-2xl border border-theme-border text-theme-text placeholder-theme-text-muted/60 font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
                <span className="absolute right-4 top-3.5">
                  <Phone size={18} className="text-theme-text-muted" />
                </span>
              </div>
              {showPhoneFormatWarning && (
                <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg mt-1">
                  {lang === 'fr'
                    ? '💡 Format recommandé : Saisissez l’indicatif sans le signe "+" (ex: 221771234567 pour le Sénégal, 33... pour la France).'
                    : '💡 Recommended format: Enter your country code and phone number without "+" (ex: 221771234567).'}
                </p>
              )}
            </div>
          </div>

          {/* LIVE BROADCAST STATUS CARD */}
          {activeShareId && isBroadcasting && (
            <div className="bg-emerald-500/10 border border-emerald-500/40 p-4 rounded-2xl space-y-3 animate-pulse-slow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {lang === 'fr' ? '📡 Partage Live Activé (Livreur)' : '📡 Live GPS Broadcasting (Driver)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBroadcasting(false)}
                  className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase font-mono"
                >
                  {lang === 'fr' ? 'Arrêter' : 'Stop'}
                </button>
              </div>
              <p className="text-xs text-theme-text-secondary leading-normal">
                {lang === 'fr'
                  ? 'Votre navigateur transmet votre position GPS en temps réel. Le client peut voir vos deplacements en direct sur la carte live de ALGS sans recharger.'
                  : 'Your browser is updating your GPS coordinates automatically. The client can follow you on the ALGS live map in real time!'}
              </p>
              {lastBroadcastTime && (
                <p className="text-[10px] text-theme-text-muted font-mono flex justify-between">
                  <span>{lang === 'fr' ? 'Dernière transmission :' : 'Last transmission:'}</span>
                  <span>{lastBroadcastTime.toLocaleTimeString()}</span>
                </p>
              )}
            </div>
          )}

          {/* STATUS NOTIFICATIONS */}
          {error && (
            <div className="flex gap-2 text-sm text-red-550 bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl animate-fade-in dark:text-red-300 dark:bg-red-950/40">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs text-red-600 dark:text-red-200">
                  {lang === 'fr' ? 'Erreur GPS' : 'GPS Error'}
                </p>
                <p className="text-xs leading-relaxed opacity-95">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="flex gap-2 text-sm text-green-650 bg-green-500/10 border border-green-500/30 p-3.5 rounded-2xl animate-fade-in dark:text-green-300 dark:bg-green-950/40">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs text-green-600 dark:text-green-200">
                  {lang === 'fr' ? 'Succès' : 'Success'}
                </p>
                <p className="text-xs leading-relaxed opacity-95">{success}</p>
              </div>
            </div>
          )}

          {/* GPS METADATA OVERLAY */}
          {locationDetails && (
            <div className="p-3 bg-theme-input rounded-xl border border-theme-border text-xs font-mono space-y-1">
              <p className="text-theme-text-secondary flex justify-between">
                <span>Latitude :</span>
                <span className="text-theme-text font-medium">{locationDetails.latitude.toFixed(6)}</span>
              </p>
              <p className="text-theme-text-secondary flex justify-between">
                <span>Longitude :</span>
                <span className="text-theme-text font-medium">{locationDetails.longitude.toFixed(6)}</span>
              </p>
              <p className="text-theme-text-secondary flex justify-between">
                <span>{lang === 'fr' ? 'Précision GPS :' : 'GPS Accuracy :'}</span>
                <span className="text-emerald-400 font-medium">± {Math.round(locationDetails.accuracy)} {lang === 'fr' ? 'mètres' : 'meters'}</span>
              </p>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            onClick={handleShareLocation}
            disabled={loading}
            className="w-full relative group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-gray-800 disabled:to-gray-800 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-emerald-500/15"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin text-white" size={20} />
                <span>{t.home.driver.loading}</span>
              </>
            ) : (
              <>
                <Send size={18} className="text-emerald-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span>{t.home.driver.shareBtn}</span>
              </>
            )}
          </button>

          <p className="text-xs text-theme-text-muted text-center leading-normal">
            {t.home.driver.note}
          </p>

          {/* PRIVACY & AUTO-CLEAR SECURITY SETTINGS */}
          <div className="pt-4 border-t border-theme-border-thin space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="driver-auto-clear-toggle"
                  checked={autoClear}
                  onChange={(e) => {
                    setAutoClear(e.target.checked);
                    localStorage.setItem('algs_auto_clear_after_share', String(e.target.checked));
                  }}
                  className="rounded border-theme-border text-[#FF7A00] focus:ring-[#FF7A00] bg-theme-input"
                />
                <span className="text-[11px] font-bold text-theme-text-secondary uppercase tracking-wider">
                  {lang === 'fr' ? '🧹 Auto-vidange après partage' : '🧹 Auto-clear after sharing'}
                </span>
              </label>

              <button
                type="button"
                id="driver-manual-wipe-btn"
                onClick={() => {
                  setClientPhone('');
                  setDriverPhone('');
                  setLocationDetails(null);
                  setError('');
                  setSuccess('');
                  setIsBroadcasting(false);
                  localStorage.removeItem('algs_driver_phone');
                  localStorage.removeItem('algs_client_phone_recipient');
                  localStorage.removeItem('algs_driver_history');
                  setHistory([]);
                }}
                className="text-[10px] font-bold text-red-400 hover:text-red-350 transition-colors uppercase font-mono tracking-wider"
              >
                {lang === 'fr' ? 'Vider tout le cache' : 'Wipe all cache'}
              </button>
            </div>
            <p className="text-[10px] text-theme-text-muted leading-relaxed font-sans">
              {lang === 'fr'
                ? "Libère instantanément les ressources de l'appareil. Idéal lorsque plusieurs personnes partagent le même téléphone : évite que d'anciennes coordonnées ou de vieux numéros ne restent visibles."
                : "Instantly releases device resources. Highly recommended when multiple people share the same phone: prevents older details or phone numbers from staying stored/visible."}
            </p>
          </div>
        </div>
      </div>

      {/* RECENT HISTORIC ACTIONS */}
      {history.length > 0 && (
        <div className="bg-theme-card p-5 rounded-3xl border border-theme-border space-y-3.5 shadow-xl">
          <h4 className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider flex items-center gap-2">
            <History size={14} className="text-theme-text-muted" />
            {lang === 'fr' ? 'Historique de partage (Livreur)' : 'Sharing History (Driver)'}
          </h4>
          <div className="divide-y divide-theme-border space-y-2.5">
            {history.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex justify-between items-center text-xs text-theme-text">
                <div>
                  <p className="font-semibold text-theme-text flex items-center gap-1">
                    {lang === 'fr' ? 'Destinataire (Client)' : 'Recipient (Client)'} : <span className="font-mono text-emerald-400">+{item.clientPhone}</span>
                  </p>
                  <p className="text-[10px] text-theme-text-muted mt-0.5 font-mono">
                    {new Date(item.timestamp).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <a
                  href={item.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-theme-card hover:bg-theme-card-hover border border-theme-border font-medium text-theme-text px-2.5 py-1.5 rounded-xl transition-all font-mono"
                >
                  Maps <ExternalLink size={12} className="text-theme-text-muted" />
                </a>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setHistory([]);
              localStorage.removeItem('algs_driver_history');
            }}
            className="text-[10px] font-bold text-red-400 hover:text-red-350 transition-colors w-full text-center tracking-wider"
          >
            {lang === 'fr' ? "VIDER L'HISTORIQUE" : "CLEAR HISTORY"}
          </button>
        </div>
      )}
    </div>
  );
}
