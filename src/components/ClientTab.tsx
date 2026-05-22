import { useState, useEffect } from 'react';
import { 
  MapPin, 
  MessageSquare, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Smartphone, 
  Compass, 
  History, 
  Phone,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { getCurrentPosition, createGoogleMapsLink, GeolocationResult, GeolocationError } from '../utils/geolocation';
import { createWhatsAppLink, isValidInternationalPhone, formatPhoneForWhatsApp } from '../utils/whatsapp';

interface HistoryItem {
  id: string;
  timestamp: number;
  driverPhone: string;
  latitude: number;
  longitude: number;
  mapsLink: string;
}

export default function ClientTab() {
  const [clientPhone, setClientPhone] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [locationDetails, setLocationDetails] = useState<GeolocationResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

    if (!driverPhone.trim()) {
      setError('⚠️ Le numéro de téléphone du livreur est requis.');
      return;
    }

    if (!isValidInternationalPhone(driverPhone)) {
      setError('⚠️ Format invalide. Assurez-vous d’entrer un numéro avec son code pays (ex: 221782632977).');
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

      // Step 2: Formulate the message to deliver
      const timestampLabel = new Date(position.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const message = `📍 *ALGS - Ma Position de Livraison*\n\nVoici ma position exacte partagée à ${timestampLabel} :\n${mapsLink}\n\n_Cliquez sur le lien pour ouvrir Google Maps et naviguer vers chez moi._`;

      // Step 3: Create the WhatsApp deep link
      const waLink = createWhatsAppLink(driverPhone, message);

      // Save driver number to localStorage
      handleSaveDriverPhone();
      if (clientPhone) {
        handleSaveClientPhone();
      }

      // Step 4: Save this into browser history for reference
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        driverPhone: driverPhone,
        latitude: lat,
        longitude: lng,
        mapsLink: mapsLink
      };
      const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10
      setHistory(updatedHistory);
      localStorage.setItem('algs_client_history', JSON.stringify(updatedHistory));

      setSuccess(`Position récupérée avec succès (Précision ±${Math.round(position.accuracy)}m). Redirection vers WhatsApp...`);
      
      // Step 5: Trigger WhatsApp opening
      setTimeout(() => {
        window.open(waLink, '_blank');
      }, 800);

    } catch (err: any) {
      if (err instanceof GeolocationError) {
        setError(err.message);
      } else {
        setError("Impossible de déterminer votre localisation GPS. Assurez-vous que l'accès GPS est autorisé dans vos paramètres système.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Help user auto-detect formatted wa.me numbers
  const driverWhatsAppFormatted = formatPhoneForWhatsApp(driverPhone);
  const showPhoneFormatWarning = driverPhone.trim().length > 0 && !driverPhone.startsWith('+') && !/^\d{11,15}$/.test(driverWhatsAppFormatted);

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      {/* Dynamic Header Badge */}
      <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-3 rounded-2xl flex items-center gap-3">
        <Smartphone className="text-blue-400 shrink-0" size={24} />
        <div>
          <h4 className="font-semibold text-blue-300 text-sm">Mode Client</h4>
          <p className="text-xs text-gray-400">Partagez votre position GPS exacte instantanément avec le livreur via WhatsApp.</p>
        </div>
      </div>

      <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 space-y-5 shadow-2xl backdrop-blur-md">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="text-blue-500 animate-pulse" size={20} />
          Informations de Livraison
        </h3>

        <div className="space-y-4">
          {/* CLIENT PHONE */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Mon Numéro WhatsApp (Facultatif)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 text-sm font-mono">+</span>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                onBlur={handleSaveClientPhone}
                placeholder="221782632977"
                className="w-full pl-8 pr-4 py-3 bg-gray-950/80 rounded-2xl border border-gray-800 text-white placeholder-gray-600 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-500">Permet de mémoriser votre numéro sur cet appareil.</p>
          </div>

          {/* DRIVER PHONE */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
              Numéro de téléphone du livreur <span className="text-blue-400 font-bold">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 text-sm font-mono">+</span>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                onBlur={handleSaveDriverPhone}
                placeholder="221782632977"
                className="w-full pl-8 pr-12 py-3.5 bg-gray-950/80 rounded-2xl border border-gray-800 text-white placeholder-gray-600 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <span className="absolute right-4 top-3.5">
                <Phone size={18} className="text-gray-500" />
              </span>
            </div>
            {showPhoneFormatWarning && (
              <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg mt-1">
                💡 Incluez l'indicatif sans le symbole "+" (ex: <strong>221</strong> pour le Sénégal, <strong>33</strong> pour la France).
              </p>
            )}
          </div>

          {/* STATUS NOTIFICATIONS */}
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
            <div className="flex gap-2 text-sm text-green-400 bg-green-950/30 border border-green-500/20 p-3.5 rounded-2xl">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Succès</p>
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
                <span className="text-blue-400 font-medium">± {Math.round(locationDetails.accuracy)} mètres</span>
              </p>
            </div>
          )}

          {/* ACTION BUTTON */}
          <button
            onClick={handleShareLocation}
            disabled={loading}
            className="w-full relative group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-gray-800 disabled:to-gray-800 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-blue-500/15"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin text-white" size={20} />
                <span>Calcul du GPS en cours...</span>
              </>
            ) : (
              <>
                <MapPin size={20} className="text-blue-100 group-hover:scale-110 transition-transform" />
                <span>📍 Partager ma position GPS</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Cette action récupère votre position satellite exacte pour la transmettre via WhatsApp.
          </p>
        </div>
      </div>

      {/* RECENT HISTORIC ACTIONS */}
      {history.length > 0 && (
        <div className="bg-gray-900/40 p-5 rounded-3xl border border-gray-800 space-y-3.5 shadow-xl">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <History size={14} className="text-gray-400" />
            Historique récent (Client)
          </h4>
          <div className="divide-y divide-gray-800/80 space-y-2.5">
            {history.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-gray-300 flex items-center gap-1">
                    Livreur : <span className="font-mono text-blue-400">+{item.driverPhone}</span>
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
              localStorage.removeItem('algs_client_history');
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
