import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
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
  driverPhone: string;
  latitude: number;
  longitude: number;
  mapsLink: string;
}

interface ClientTabProps {
  t: TranslationSchema;
  lang: 'fr' | 'en';
}

export default function ClientTab({ t, lang }: ClientTabProps) {
  const [clientPhone, setClientPhone] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationDetails, setLocationDetails] = useState<GeolocationResult | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeShareId, setActiveShareId] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [lastBroadcastTime, setLastBroadcastTime] = useState<Date | null>(null);

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

  // Resource capacity manager: auto-stop broadcasting after 15 minutes of inactivity to save bandwidth & client battery
  useEffect(() => {
    if (!isBroadcasting) return;

    const timeout = setTimeout(() => {
      setIsBroadcasting(false);
    }, 15 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [isBroadcasting]);

  // Automated 10-second cache clearer: maintains optimal device performance and absolute multi-user confidentiality
  useEffect(() => {
    const interval = setInterval(() => {
      setError('');
      setSuccess('');
      if (!isBroadcasting) {
        setDriverPhone('');
        setLocationDetails(null);
        setAccuracyWarning(null);
        localStorage.removeItem('algs_driver_phone_recipient');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isBroadcasting]);

  // Load saved numbers on mount
  useEffect(() => {
    const savedClient = localStorage.getItem('algs_client_phone');
    const savedDriver = localStorage.getItem('algs_driver_phone_recipient');
    if (savedClient) setClientPhone(savedClient);
    if (savedDriver) setDriverPhone(savedDriver);

    // Load history
    const savedHistory = localStorage.getItem('algs_client_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Sync client phone number to localStorage on blur
  const handleSaveClientPhone = () => {
    localStorage.setItem('algs_client_phone', clientPhone);
  };

  // Sync driver phone number to localStorage on change/blur
  const handleSaveDriverPhone = () => {
    localStorage.setItem('algs_driver_phone_recipient', driverPhone);
  };

  const handleShareLocation = async () => {
    setError('');
    setSuccess('');
    setLocationDetails(null);
    setAccuracyWarning(null);

    if (!driverPhone.trim()) {
      setError(t.home.client.error);
      return;
    }

    if (!isValidInternationalPhone(driverPhone)) {
      setError(
        lang === 'fr' 
          ? 'Format invalide. Assurez-vous d’entrer un numéro avec son code pays (ex: 221770000000).' 
          : 'Invalid format. Standardize with county code (ex: 221770000000).'
      );
      return;
    }

    setLoading(true);

    try {
      // Step 1: Query Browser Geolocation with high-accuracy settings
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
        type: 'client',
        sender_phone: clientPhone || 'Client',
        recipient_phone: driverPhone,
        latitude: lat,
        longitude: lng,
        accuracy: position.accuracy,
      });

      // Step 3: Formulate the message to deliver
      const timestampLabel = new Date(position.timestamp).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const appUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;
      const trackingPageLink = shareId ? `${appUrl}/?track=${shareId}` : '';

      const message = lang === 'fr'
        ? `📍 *ALGS - Ma Position de Livraison*\n\nVoici ma position exacte partagée à ${timestampLabel} :\n${mapsLink}${trackingPageLink ? `\n\n📡 *Suivi en Temps Réel ALGS Live* (Recommandé) :\n${trackingPageLink}` : ''}\n\n_Cliquez sur le lien pour naviguer directement ou suivre l'itinéraire._`
        : `📍 *ALGS - My Delivery Location*\n\nHere is my exact location shared at ${timestampLabel} :\n${mapsLink}${trackingPageLink ? `\n\n📡 *ALGS Live Tracking* (Recommended) :\n${trackingPageLink}` : ''}\n\n_Click the link to navigate directly or track real-time coordinates._`;

      // Step 4: Create the WhatsApp deep link
      const waLink = createWhatsAppLink(driverPhone, message);

      // Save driver number to localStorage
      handleSaveDriverPhone();
      if (clientPhone) {
        handleSaveClientPhone();
      }

      // Step 5: Save this into browser history for reference
      const newItem: HistoryItem = {
        id: shareId || Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        driverPhone: driverPhone,
        latitude: lat,
        longitude: lng,
        mapsLink: trackingPageLink || mapsLink
      };
      const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10
      setHistory(updatedHistory);
      localStorage.setItem('algs_client_history', JSON.stringify(updatedHistory));

      if (shareId) {
        setActiveShareId(shareId);
        setIsBroadcasting(true);
        setLastBroadcastTime(new Date());
      }

      setSuccess(
        lang === 'fr'
          ? `Position récupérée avec succès (Précision ±${Math.round(position.accuracy)}m). Redirection vers WhatsApp...`
          : `Location retrieved successfully (Accuracy ±${Math.round(position.accuracy)}m). Redirecting to WhatsApp...`
      );
      
      // Step 5: Trigger WhatsApp opening
      setTimeout(() => {
        window.open(waLink, '_blank');
        // Vidange instantanée des informations saisies pour libérer le cache et protéger la confidentialité multi-utilisateurs
        setDriverPhone('');
        localStorage.removeItem('algs_driver_phone_recipient');
        setLocationDetails(null);
      }, 800);

    } catch (err: any) {
      if (err instanceof GeolocationError) {
        setError(err.message);
      } else {
        setError(t.home.client.gpsError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Help user auto-detect formatted wa.me numbers
  const isDriverPhoneValid = !driverPhone.trim() || isValidInternationalPhone(driverPhone);
  const showPhoneFormatWarning = driverPhone.trim().length > 0 && !isDriverPhoneValid;

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
      <div className="bg-orange-500/10 border border-orange-500/30 px-4 py-3 rounded-2xl flex items-center gap-3 animate-fade-in">
        <Smartphone className="text-orange-400 shrink-0" size={24} />
        <div>
          <h4 className="font-semibold text-orange-300 text-sm">{t.home.clientTab}</h4>
          <p className="text-xs text-theme-text-secondary leading-normal">
            {lang === 'fr'
              ? 'Partagez votre position GPS exacte instantanément avec le livreur via WhatsApp.'
              : 'Share your exact GPS location instantly with the delivery driver via WhatsApp.'}
          </p>
        </div>
      </div>

      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-5 shadow-2xl backdrop-blur-md">
        <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
          <Compass className="text-orange-500 animate-pulse" size={20} />
          {t.home.client.title}
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CLIENT PHONE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
                {t.home.client.myPhone}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-theme-text-muted text-sm font-mono">+</span>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  onBlur={handleSaveClientPhone}
                  placeholder="221770000000"
                  className="w-full pl-8 pr-4 py-3 bg-theme-input rounded-2xl border border-theme-border text-theme-text placeholder-theme-text-muted/60 font-mono text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-theme-text-muted">
                {lang === 'fr' 
                  ? 'Permet de mémoriser votre numéro sur cet appareil.' 
                  : 'Saves your phone number on this local device.'}
              </p>
            </div>

            {/* DRIVER PHONE */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
                {t.home.client.driverPhone} <span className="text-orange-400 font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-theme-text-muted text-sm font-mono">+</span>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  onBlur={handleSaveDriverPhone}
                  placeholder="221770000000"
                  className="w-full pl-8 pr-12 py-3.5 bg-theme-input rounded-2xl border border-theme-border text-theme-text placeholder-theme-text-muted/60 font-mono text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                />
                <span className="absolute right-4 top-3.5">
                  <Phone size={18} className="text-theme-text-muted" />
                </span>
              </div>
              {showPhoneFormatWarning && (
                <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg mt-1">
                  {lang === 'fr'
                    ? '💡 Format recommandé : Saisissez l’indicatif sans le signe "+" (ex: 221770000000 pour le Sénégal, 33... pour la France).'
                    : '💡 Recommended format: Enter your country code and phone number without "+" (ex: 221770000000).'}
                </p>
              )}
            </div>
          </div>

          {/* LIVE BROADCAST STATUS CARD */}
          {activeShareId && isBroadcasting && (
            <div className="bg-orange-500/10 border border-orange-500/40 p-4 rounded-2xl space-y-3 animate-pulse-slow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping shrink-0" />
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                    {lang === 'fr' ? '📡 Partage Live Activé' : '📡 Live GPS Broadcasting'}
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
                  ? 'Votre navigateur transmet des mises à jour GPS en temps réel. Le destinataire peut voir vos déplacements en direct sur la carte sans recharger !'
                  : 'Your browser is updating your GPS coordinates automatically. The recipient can see you moving on the live map in real-time!'}
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
                  {lang === 'fr' ? 'Erreur de localisation' : 'Location Error'}
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
                <span className="text-orange-400 font-medium">± {Math.round(locationDetails.accuracy)} {lang === 'fr' ? 'mètres' : 'meters'}</span>
              </p>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            onClick={handleShareLocation}
            disabled={loading}
            className="w-full relative group bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-gray-800 disabled:to-gray-800 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-orange-500/15"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin text-white" size={20} />
                <span>{t.home.client.loading}</span>
              </>
            ) : (
              <>
                <MapPin size={20} className="text-orange-100 group-hover:scale-110 transition-transform" />
                <span>{t.home.client.shareBtn}</span>
              </>
            )}
          </button>

          <p className="text-xs text-theme-text-muted text-center leading-normal">
            {t.home.client.note}
          </p>
        </div>
      </div>

      {/* RECENT HISTORIC ACTIONS */}
      {history.length > 0 && (
        <div className="bg-theme-card p-5 rounded-3xl border border-theme-border space-y-3.5 shadow-xl">
          <h4 className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider flex items-center gap-2">
            <History size={14} className="text-theme-text-muted" />
            {lang === 'fr' ? 'Historique de partage (Client)' : 'Sharing History (Client)'}
          </h4>
          <div className="divide-y divide-theme-border space-y-2.5">
            {history.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex justify-between items-center text-xs text-theme-text">
                <div>
                  <p className="font-semibold text-theme-text flex items-center gap-1">
                    {lang === 'fr' ? 'Destinataire (Livreur)' : 'Recipient (Driver)'} : <span className="font-mono text-orange-400">+{item.driverPhone}</span>
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
              localStorage.removeItem('algs_client_history');
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
