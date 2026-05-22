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
  ExternalLink
} from 'lucide-react';
import { getCurrentPosition, createGoogleMapsLink, GeolocationResult, GeolocationError } from '../utils/geolocation';
import { createWhatsAppLink, isValidInternationalPhone, formatPhoneForWhatsApp } from '../utils/whatsapp';

interface HistoryItem {
  id: string;
  timestamp: number;
  clientPhone: string;
  latitude: number;
  longitude: number;
  mapsLink: string;
}

export default function DriverTab() {
  const [driverPhone, setDriverPhone] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationDetails, setLocationDetails] = useState<GeolocationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

    if (!clientPhone.trim()) {
      setError('⚠️ Le numéro de téléphone du client est requis.');
      return;
    }

    if (!isValidInternationalPhone(clientPhone)) {
      setError('⚠️ Format de numéro invalide. Assurez-vous d’entrer l’indicatif complet sans le signe "+" (ex: 221771234567).');
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

      // Step 2: Formulate message
      const timestampLabel = new Date(position.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const message = `🚚 *ALGS - Suivi du Livreur*\n\nBonjour ! Je suis en route pour votre livraison. Voici ma position actuelle en temps réel (${timestampLabel}) :\n${mapsLink}\n\n_Suivez mon itinéraire en ouvrant directement ce lien sur Google Maps._`;

      // Step 3: Formulate deep link with client's phone
      const waLink = createWhatsAppLink(clientPhone, message);

      // Save credentials for reuse
      handleSaveClientPhone();
      if (driverPhone) {
        handleSaveDriverPhone();
      }

      // Step 4: Record to local history logs
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        clientPhone: clientPhone,
        latitude: lat,
        longitude: lng,
        mapsLink: mapsLink
      };
      const updatedHistory = [newItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('algs_driver_history', JSON.stringify(updatedHistory));

      setSuccess(`Position GPS acquise avec succès (Précision ±${Math.round(position.accuracy)}m). Lancement de WhatsApp en cours...`);

      // Step 5: Redirect to target WhatsApp Chat
      setTimeout(() => {
        window.open(waLink, '_blank');
      }, 800);

    } catch (err: any) {
      if (err instanceof GeolocationError) {
        setError(err.message);
      } else {
        setError("Erreur de calcul GPS. Vérifiez que les autorisations de localisation mobile sont actives.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Help user auto-detect formatted wa.me numbers
  const clientWhatsAppFormatted = formatPhoneForWhatsApp(clientPhone);
  const showPhoneFormatWarning = clientPhone.trim().length > 0 && !clientPhone.startsWith('+') && !/^\d{11,15}$/.test(clientWhatsAppFormatted);

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      {/* Dynamic Header Badge */}
      <div className="bg-emerald-600/10 border border-emerald-500/20 px-4 py-3 rounded-2xl flex items-center gap-3">
        <Truck className="text-emerald-400 shrink-0" size={24} />
        <div>
          <h4 className="font-semibold text-emerald-300 text-sm">Mode Livreur</h4>
          <p className="text-xs text-gray-400">Envoyez vos coordonnées GPS de déplacement au client par WhatsApp pour qu'il suive votre trajet.</p>
        </div>
      </div>

      <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 space-y-5 shadow-2xl backdrop-blur-md">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="text-emerald-500 animate-pulse" size={20} />
          Informations de Course
        </h3>

        <div className="space-y-4">
          {/* DRIVER PHONE */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Mon Numéro WhatsApp (Livreur) (Facultatif)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 text-sm font-mono">+</span>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                onBlur={handleSaveDriverPhone}
                placeholder="221782632977"
                className="w-full pl-8 pr-4 py-3 bg-gray-950/80 rounded-2xl border border-gray-800 text-white placeholder-gray-600 font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-500">Mémorise votre numéro pour vos prochaines livraisons.</p>
          </div>

          {/* CLIENT PHONE */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Numéro de téléphone du client <span className="text-emerald-400 font-bold">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 text-sm font-mono">+</span>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                onBlur={handleSaveClientPhone}
                placeholder="22177XXXXXXX"
                className="w-full pl-8 pr-12 py-3.5 bg-gray-950/80 rounded-2xl border border-gray-800 text-white placeholder-gray-600 font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
              <span className="absolute right-4 top-3.5">
                <Phone size={18} className="text-gray-500" />
              </span>
            </div>
            {showPhoneFormatWarning && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg mt-1">
                💡 Pensez à inclure l'indicatif sans le symbole "+" (ex: <strong>221</strong> pour le Sénégal, <strong>33</strong> pour la France).
              </p>
            )}
          </div>

          {/* NOTIFICATION LOGS */}
          {error && (
            <div className="flex gap-2 text-sm text-red-400 bg-red-950/30 border border-red-500/20 p-3.5 rounded-2xl">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Erreur de localisation</p>
                <p className="text-xs leading-relaxed opacity-90">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="flex gap-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 p-3.5 rounded-2xl">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs text-emerald-300">Succès</p>
                <p className="text-xs leading-relaxed opacity-90">{success}</p>
              </div>
            </div>
          )}

          {/* GPS METADATA OVERLAY */}
          {locationDetails && (
            <div className="p-3 bg-gray-950/50 rounded-xl border border-gray-800 text-xs font-mono space-y-1">
              <p className="text-gray-400 flex justify-between">
                <span>Latitude :</span>
                <span className="text-white font-medium">{locationDetails.latitude.toFixed(6)}</span>
              </p>
              <p className="text-gray-400 flex justify-between">
                <span>Longitude :</span>
                <span className="text-white font-medium">{locationDetails.longitude.toFixed(6)}</span>
              </p>
              <p className="text-gray-400 flex justify-between">
                <span>Précision GPS :</span>
                <span className="text-emerald-400 font-medium">± {Math.round(locationDetails.accuracy)} mètres</span>
              </p>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            onClick={handleShareLocation}
            disabled={loading}
            className="w-full relative group bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-800 disabled:to-gray-800 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-emerald-500/15"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin text-white" size={20} />
                <span>Identification GPS...</span>
              </>
            ) : (
              <>
                <Send size={20} className="text-emerald-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span>📍 Envoyer ma position au client</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Cette action envoie vos coordonnées réelles pour que le client active l'itinéraire Google Maps.
          </p>
        </div>
      </div>

      {/* RECENT DRIVER HISTORIC ACTIONS */}
      {history.length > 0 && (
        <div className="bg-gray-900/40 p-5 rounded-3xl border border-gray-800 space-y-3.5 shadow-xl">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <History size={14} className="text-gray-400" />
            Historique récent (Livreur)
          </h4>
          <div className="divide-y divide-gray-800/80 space-y-2.5">
            {history.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-gray-300 flex items-center gap-1">
                    Client : <span className="font-mono text-emerald-400">+{item.clientPhone}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(item.timestamp).toLocaleString('fr-FR', {
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
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700/80 border border-gray-700 font-medium text-gray-300 px-2.5 py-1.5 rounded-xl transition-all"
                >
                  Maps <ExternalLink size={12} className="text-gray-400" />
                </a>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setHistory([]);
              localStorage.removeItem('algs_driver_history');
            }}
            className="text-[10px] font-semibold text-red-400/80 hover:text-red-400 transition-colors w-full text-center"
          >
            Vider l'historique
          </button>
        </div>
      )}
    </div>
  );
}
