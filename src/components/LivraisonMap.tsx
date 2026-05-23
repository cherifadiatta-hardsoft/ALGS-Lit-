import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import io, { Socket } from 'socket.io-client';
import { 
  Compass, 
  Loader2, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Award, 
  Sparkles, 
  Navigation,
  ExternalLink,
  Wifi,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';

// Fix Leaflet's default marker asset path issues in SPA bundlers
// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Red icon for the Driver to easily distinguish from the Client
const driverIconStyle = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationMarkerProps {
  position: { lat: number; lng: number } | null;
  setPosition: (coords: { lat: number; lng: number }) => void;
}

function LocationMarker({ position, setPosition }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lng]}>
      <Popup>
        <span className="font-sans font-semibold text-xs text-slate-800">
          Votre point de livraison sélectionné
        </span>
      </Popup>
    </Marker>
  ) : null;
}

interface Livreur {
  id: number;
  nom: string;
  telephone: string;
  disponible: boolean;
  note: number;
  vehicule: string;
  distance_km: number;
}

interface LivraisonMapProps {
  lang: 'fr' | 'en';
}

export default function LivraisonMap({ lang }: LivraisonMapProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [driverLivePosition, setDriverLivePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');
  const [livreur, setLivreur] = useState<Livreur | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showNativeDoc, setShowNativeDoc] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Default coordinate center: Dakar, Senegal
  const defaultCenter: [number, number] = [14.7167, -17.4677];

  // Try to pre-fill client coordinates on mount
  useEffect(() => {
    const savedNom = localStorage.getItem('algs_client_name') || '';
    const savedTel = localStorage.getItem('algs_client_phone') || '';
    if (savedNom) setClientNom(savedNom);
    if (savedTel) setClientTel(savedTel);
  }, []);

  // Sync inputs to local persistence
  const handleSaveInputs = () => {
    localStorage.setItem('algs_client_name', clientNom);
    localStorage.setItem('algs_client_phone', clientTel);
  };

  // Connection and Room subscriptions for Live tracking feedback
  useEffect(() => {
    if (!livreur) return;

    // Connect socket
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Matching client listening to delivery tracking-livreur-${livreur.id}`);
      // Join corresponding driver telemetry tracking stream
      socket.emit('join_livreur', `tracking-livreur-${livreur.id}`);
    });

    socket.on('position_mise_a_jour', (data: { lat: number; lng: number }) => {
      console.log('Driver position update caught in client view:', data);
      setDriverLivePosition({ lat: data.lat, lng: data.lng });
      setSuccess(
        lang === 'fr' 
          ? `✓ Localisation du livreur mise à jour en direct !` 
          : `✓ Driver live telemetry position updated!`
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [livreur, lang]);

  // Automatically fetch GPS position
  const partagerPosition = () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    if (!navigator.geolocation) {
      setError(
        lang === 'fr' 
          ? 'La géolocalisation n’est pas supportée par votre navigateur.' 
          : 'Geolocation is not supported by your browser.'
      );
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(coords);
        setSuccess(
          lang === 'fr' 
            ? 'Position GPS récupérée avec succès !' 
            : 'GPS location retrieved successfully!'
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(
          lang === 'fr' 
            ? 'Accès GPS refusé ou indisponible. Veuillez cliquer directement sur la carte pour définir votre position.' 
            : 'GPS access denied or unavailable. Please click directly on the map to define your location.'
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit delivery request and query proximity matchmaker on backend pool
  const demanderLivraison = async () => {
    setError('');
    setSuccess('');

    if (!position || !clientNom.trim() || !clientTel.trim()) {
      setError(
        lang === 'fr'
          ? 'Veuillez renseigner votre nom, téléphone et définir votre position sur la carte.'
          : 'Please enter your name, phone and define your position on the map.'
      );
      return;
    }

    setLoading(true);
    handleSaveInputs();

    try {
      // Use relative path to ensure production compatibility
      const res = await axios.post('/api/demande-livraison', {
        nom: clientNom,
        tel: clientTel,
        lat: position.lat,
        lng: position.lng,
      });

      if (res.data.success) {
        setLivreur(res.data.livreur);
        if (res.data.commandeId) {
          localStorage.setItem('algs_last_commande_id', String(res.data.commandeId));
        }
        // Set mock initial position for visualization
        setDriverLivePosition({
          lat: position.lat + 0.005,
          lng: position.lng - 0.005
        });
        setSuccess(
          lang === 'fr'
            ? `Livreur assigné automatiquement : ${res.data.livreur.nom}`
            : `Driver successfully matched: ${res.data.livreur.nom}`
        );
      } else {
        setError(
          lang === 'fr'
            ? 'Aucun livreur disponible dans un rayon de 10km pour le moment.'
            : 'No drivers available within 10km at this moment.'
        );
      }
    } catch (e) {
      console.error(e);
      setError(
        lang === 'fr'
          ? 'Erreur lors de la communication avec le serveur de matching.'
          : 'Error communicating with the matching server.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Create customized WhatsApp payload with OpenStreetMap link integration
  const contacterLivreur = () => {
    if (!livreur || !position) return;
    
    // Clean telephone format
    const cleanPhone = livreur.telephone.replace(/\+/g, '').trim();
    
    const msg = lang === 'fr'
      ? `Bonjour *${livreur.nom}*, j'ai commandé une livraison ALGS.\n\n📍 *Ma position de livraison (OpenStreetMap)*:\nhttps://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}#map=17/${position.lat}/${position.lng}\n\nMerci de lancer l'itinéraire pour me rejoindre !`
      : `Hello *${livreur.nom}*, I initiated an ALGS delivery.\n\n📍 *My delivery location (OpenStreetMap)*:\nhttps://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}#map=17/${position.lat}/${position.lng}\n\nThank you for launching the directions!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const copyNativeCodeToClipboard = () => {
    const rawCode = `import React, { useEffect, useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import BackgroundGeolocation from 'react-native-background-geolocation';
import io from 'socket.io-client';

const SOCKET_URL = 'https://ton-api.algs.com'; // URL de ton API

export default function LivreurBackground({ livreurId }) {
  const [isTracking, setIsTracking] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL);
    s.emit('join_livreur', livreurId);
    setSocket(s);

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
      distanceFilter: 10, // Seuil de mouvement de 10m
      stopTimeout: 1,
      foregroundService: true,
      notification: {
        title: "ALGS Livraison Active",
        text: "Partage de télémétrie GPS en cours..."
      }
    }).then((state) => {
      setIsTracking(state.enabled);
    });

    const onLocation = BackgroundGeolocation.onLocation((location) => {
      s.emit('update_position', {
        livreurId,
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
    });

    return () => {
      onLocation.remove();
      s.disconnect();
    };
  }, []);

  const toggleTracking = async () => {
    if (isTracking) {
      await BackgroundGeolocation.stop();
      setIsTracking(false);
    } else {
      const status = await BackgroundGeolocation.requestPermission();
      if (status === BackgroundGeolocation.AUTHORIZED) {
        await BackgroundGeolocation.start();
        setIsTracking(true);
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, textAlign: 'center' }}>
        {isTracking ? '🟢 En ligne' : '🔴 Hors ligne'}
      </Text>
      <Button title={isTracking ? "Se déconnecter" : "Se mettre en ligne"} onPress={toggleTracking} />
    </View>
  );
}`;
    navigator.clipboard.writeText(rawCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-theme-text">
      
      {/* Header Info badge */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 rounded-2xl flex items-center gap-3">
        <Sparkles className="text-emerald-400 shrink-0 animate-pulse" size={24} />
        <div>
          <h4 className="font-semibold text-emerald-300 text-sm">
            {lang === 'fr' ? 'Matching Automatique PostGIS & Suivi Live' : 'AI Proximity Matching & Live Telemetry'}
          </h4>
          <p className="text-xs text-theme-text-secondary leading-normal">
            {lang === 'fr'
              ? 'Sélection instantanée du meilleur livreur à proximité grâce à notre piscine PostgreSQL PostGIS + Live Tracking WS.'
              : 'Instant calculation of the closest driver plus Real-time Socket.IO moving markers.'}
          </p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-5 shadow-2xl backdrop-blur-md">
        <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
          <Navigation className="text-emerald-400 rotate-45 animate-pulse" size={20} />
          {lang === 'fr' ? "Demande de Livraison Inteligente" : "Smart Delivery Dispatch"}
        </h3>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
              {lang === 'fr' ? "Votre Nom" : "Your Name"} <span className="text-emerald-400 font-bold">*</span>
            </label>
            <input
              type="text"
              placeholder={lang === 'fr' ? "Ex: Cheikh Diop" : "e.g. John Doe"}
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              onBlur={handleSaveInputs}
              className="w-full px-4 py-3 bg-theme-input rounded-2xl border border-theme-border text-theme-text placeholder-theme-text-muted/60 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
              {lang === 'fr' ? "Votre Téléphone (WhatsApp)" : "Your Phone (WhatsApp)"} <span className="text-emerald-400 font-bold">*</span>
            </label>
            <input
              type="tel"
              placeholder="221770000000"
              value={clientTel}
              onChange={(e) => setClientTel(e.target.value)}
              onBlur={handleSaveInputs}
              className="w-full px-4 py-3 bg-theme-input rounded-2xl border border-theme-border text-theme-text placeholder-theme-text-muted/60 font-mono text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* GPS location Trigger */}
        <button
          onClick={partagerPosition}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 font-bold text-sm rounded-2xl transition-all cursor-pointer select-none"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <MapPin size={16} />
          )}
          <span>{lang === 'fr' ? '📍 Partager ma position GPS' : '📍 Share my GPS Location'}</span>
        </button>

        {/* Map Header with manual click indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
              {lang === 'fr' ? "Épingler ma position sur la carte (clic / toucher pour déplacer) :" : "Pin my position on the map (click / tap to move) :"}
            </label>
            <span className="text-[10px] text-theme-text-muted font-mono bg-theme-input px-2 py-0.5 border border-theme-border rounded">
              {lang === 'fr' ? "Outils : Zoom & Clic" : "Tools: Zoom & Click"}
            </span>
          </div>

          {/* Interactive Leaflet Map Box */}
          <div className="w-full h-80 rounded-2xl overflow-hidden border border-theme-border relative shadow-lg bg-theme-input z-10">
            <MapContainer
              center={position ? [position.lat, position.lng] : defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker position={position} setPosition={setPosition} />
              
              {/* Live Driver marker visual */}
              {driverLivePosition && (
                <Marker position={[driverLivePosition.lat, driverLivePosition.lng]} icon={driverIconStyle}>
                  <Popup>
                    <div className="font-sans text-xs space-y-1">
                      <p className="font-bold text-red-650">🏍️ {livreur?.nom || 'Livreur'}</p>
                      <p className="text-[10px] text-slate-500">Télémétrie GPS connectée en live</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
          
          {driverLivePosition && (
            <div className="flex items-center gap-2 text-[10px] font-mono justify-end text-emerald-400 font-bold animate-pulse">
              <Wifi size={12} />
              <span>{lang === 'fr' ? 'Livreur surveillé en temps réel' : 'Live Driver telemetric tracking active'}</span>
            </div>
          )}
        </div>

        {/* Error / Sucess banners */}
        {error && (
          <div className="flex gap-2 text-sm text-red-500 bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl animate-fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-sans">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex gap-2 text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl animate-fade-in">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-sans">{success}</p>
          </div>
        )}

        {/* Submit to matchmaker */}
        <button
          onClick={demanderLivraison}
          disabled={!position || loading}
          className="w-full relative group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-500 disabled:from-gray-800 disabled:to-gray-800 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-emerald-500/15"
        >
          {loading ? (
            <Loader2 className="animate-spin text-white" size={20} />
          ) : (
            <Compass size={20} className="text-emerald-100 group-hover:scale-110 transition-transform" />
          )}
          <span>{lang === 'fr' ? 'Demander une livraison' : 'Request Delivery Match'}</span>
        </button>
      </div>

      {/* Matched Driver Result Card overlay */}
      {livreur && (
        <div className="bg-theme-card p-6 rounded-3xl border-2 border-emerald-500/30 shadow-2xl relative overflow-hidden animate-fade-in space-y-4">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-emerald-500/[0.05] blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-theme-border-thin pb-3">
            <h4 className="font-extrabold text-[#FF7A00] uppercase tracking-wider text-sm flex items-center gap-1.5">
              <Award size={18} />
              {lang === 'fr' ? 'Livreur assigné !' : 'Driver Assigned!'}
            </h4>
            <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 border border-emerald-500/20 text-[10px] font-mono font-bold rounded-lg uppercase">
              {livreur.vehicule}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-theme-border/30">
              <span className="text-theme-text-muted">{lang === 'fr' ? 'Nom du Livreur' : 'Driver Name'}</span>
              <span className="font-bold text-theme-text">{livreur.nom}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-theme-border/30">
              <span className="text-theme-text-muted">{lang === 'fr' ? 'Proximité' : 'Distance'}</span>
              <span className="font-bold font-mono text-emerald-400">
                {livreur.distance_km ? livreur.distance_km.toFixed(1) : '2.1'} km
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-theme-border/30">
              <span className="text-theme-text-muted">{lang === 'fr' ? 'Note qualité' : 'Rating'}</span>
              <span className="font-bold text-amber-400">★ {livreur.note || '4.8'}/5</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={contacterLivreur}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-450 active:scale-[0.98] text-white font-bold text-sm rounded-2xl shadow-lg transition-all"
            >
              <Phone size={16} />
              <span>{lang === 'fr' ? 'Contacter sur WhatsApp' : 'Contact on WhatsApp'}</span>
            </button>
            
            <p className="text-[10px] text-theme-text-secondary text-center italic mt-1 bg-theme-input p-2 rounded-xl">
              {lang === 'fr' 
                ? 'ℹ Les coordonnées du livreur bougent en direct sur la carte ci-dessus.' 
                : 'ℹ Watch the red marker on the map to track the drivers progression live.'}
            </p>
          </div>
        </div>
      )}

      {/* Production React Native Background Geolocation configuration */}
      <div className="bg-[#12131a] p-6 rounded-3xl border border-theme-border space-y-4">
        <button
          onClick={() => setShowNativeDoc(!showNativeDoc)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <Smartphone className="text-emerald-400" size={20} />
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-200">
              {lang === 'fr' ? '⚡ Code Mobile Background (Android/iOS)' : '⚡ Background Mobile Specs'}
            </h4>
          </div>
          <span className="text-xs text-emerald-400 underline font-mono cursor-pointer">
            {showNativeDoc ? (lang === 'fr' ? 'Masquer' : 'Hide') : (lang === 'fr' ? 'Afficher' : 'Show')}
          </span>
        </button>

        {showNativeDoc && (
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans mt-3 border-t border-theme-border/40 pt-4">
            <p>
              {lang === 'fr'
                ? "Pour que le smartphone du livreur transmette sa position même lorsque l'écran est verrouillé ou dans sa poche, configurez ce composant React Native :"
                : "To prevent OS deep-sleep features from cutting driver streams when the phone dashboard is locked, plug this native module directly into iOS & Android :"}
            </p>

            <div className="relative bg-slate-900 border border-theme-border p-4 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto">
              <button
                onClick={copyNativeCodeToClipboard}
                className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-705 p-1.5 rounded transition"
              >
                {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
              <pre className="whitespace-pre-wrap">{`import BackgroundGeolocation from 'react-native-background-geolocation';
import io from 'socket.io-client';

// Configure background tracking
BackgroundGeolocation.ready({
  desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
  distanceFilter: 10, // send coordinate if driver moves > 10m
  stopTimeout: 1,
  foregroundService: true, // Prevents Android OS from killing process
  notification: {
    title: "ALGS Livraison",
    text: "Partage de position actif"
  }
}).then((state) => {
  BackgroundGeolocation.start(); // Active GPS loop
});`}</pre>
            </div>
            
            <div className="p-3 bg-red-400/10 border border-red-500/20 rounded-xl">
              <span className="font-bold text-red-400 block mb-1">💡 Pro-Tip Android (Permissions) :</span>
              <p className="text-[11px] text-slate-400">
                {lang === 'fr' 
                  ? "Assurez-vous de bien déclarer les permissions ACCESS_BACKGROUND_LOCATION et FOREGROUND_SERVICE dans le fichier AndroidManifest.xml pour que l'OS donne l'accès permanent au GPS de l'appareil."
                  : "Ensure standard declare for ACCESS_BACKGROUND_LOCATION and FOREGROUND_SERVICE are appended in AndroidManifest.xml before deployment for non-blocking active service."}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

