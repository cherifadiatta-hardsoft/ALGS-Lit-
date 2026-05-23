import { useState, useEffect, useRef, FormEvent } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import io, { Socket } from 'socket.io-client';
import axios from 'axios';
import L from 'leaflet';
import { 
  Compass, 
  MapPin, 
  Navigation, 
  PhoneOutgoing, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Wifi, 
  CheckCircle2, 
  Boxes, 
  Clock, 
  Truck, 
  Check, 
  Copy 
} from 'lucide-react';

// Custom Map Marker styling profiles for beautiful high-contrast map pins
const clientIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const livreurIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface SuiviProps {
  lang: 'fr' | 'en';
}

export default function SuiviLivraison({ lang }: SuiviProps) {
  // Query last commande ID created from local storage for automated tracking, fall back to mock #1
  const [commandeIdInput, setCommandeIdInput] = useState<string>('');
  const [activeCommandeId, setActiveCommandeId] = useState<number | null>(null);

  const [positionClient, setPositionClient] = useState<{ lat: number; lng: number } | null>(null);
  const [positionLivreur, setPositionLivreur] = useState<{ lat: number; lng: number } | null>(null);
  const [statut, setStatut] = useState<string>('recherche'); // recherche, assignee, en_route, livree
  const [livreurTel, setLivreurTel] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [searchSuccess, setSearchSuccess] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  // OSRM precise routing states
  const [itineraire, setItineraire] = useState<[number, number][]>([]);
  const [eta, setEta] = useState<number | null>(null);
  const [etaTrafic, setEtaTrafic] = useState<number | null>(null);
  const [statusTrafic, setStatusTrafic] = useState<string>('fluide');
  const [distance, setDistance] = useState<string | null>(null);
  const [sourceEta, setSourceEta] = useState<string>('multiplier');
  const [isFallbackRoute, setIsFallbackRoute] = useState<boolean>(false);

  // Detour / Alternate route states
  const [detourItineraire, setDetourItineraire] = useState<[number, number][]>([]);
  const [detourGainMin, setDetourGainMin] = useState<number | null>(null);
  const [detourGainPercent, setDetourGainPercent] = useState<number | null>(null);
  const [detourAxEvite, setDetourAxEvite] = useState<string>('');
  const [detourDistance, setDetourDistance] = useState<string | null>(null);
  const [detourEta, setDetourEta] = useState<number | null>(null);
  const [showDetourOption, setShowDetourOption] = useState<boolean>(true);
  
  const lastRouteFetchTime = useRef<number>(0);
  const socketRef = useRef<Socket | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  const forceRecalculateRoute = () => {
    setItineraire([]);
    setDetourItineraire([]);
    lastRouteFetchTime.current = 0;
    addLog(lang === 'fr' ? 'Force le recalcul d\'itinéraire routier...' : 'Recalculating routing path manually...');
  };

  // Automated default tracker finder on component loading
  useEffect(() => {
    const savedId = localStorage.getItem('algs_last_commande_id');
    if (savedId) {
      setActiveCommandeId(Number(savedId));
      setCommandeIdInput(savedId);
    } else {
      setActiveCommandeId(1);
      setCommandeIdInput('1');
    }
  }, []);

  // Sync API and WebSocket bindings dynamically whenever active commande id is mutated
  useEffect(() => {
    if (activeCommandeId === null) return;

    setError('');
    setSearchSuccess('');
    setPositionClient(null);
    setPositionLivreur(null);
    setItineraire([]);
    setEta(null);
    setEtaTrafic(null);
    setStatusTrafic('fluide');
    setSourceEta('multiplier');
    setDistance(null);
    setIsFallbackRoute(false);

    // Reset detour details
    setDetourItineraire([]);
    setDetourGainMin(null);
    setDetourGainPercent(null);
    setDetourAxEvite('');
    setDetourDistance(null);
    setDetourEta(null);

    lastRouteFetchTime.current = 0;

    addLog(lang === 'fr' ? `Chargement de la commande #${activeCommandeId}...` : `Fetching order #${activeCommandeId}...`);

    // 1. Load initial payload values from Express rest endpoint
    axios.get(`/api/commande/${activeCommandeId}`)
      .then((res) => {
        const data = res.data;
        setPositionClient(data.position_client);
        setPositionLivreur(data.position_livreur);
        setStatut(data.statut || 'recherche');
        setLivreurTel(data.livreur_tel || '');
        addLog(lang === 'fr' ? 'Coordonnées initiales chargées ✓' : 'Initial spatial coordinates loaded ✓');
      })
      .catch((err) => {
        console.error(err);
        setError(lang === 'fr' ? 'Commande introuvable ou inexistante.' : 'Order not found in database.');
        // Setup mock default points so user is always presented with loaded preview
        setPositionClient({ lat: 14.7167, lng: -17.4677 });
        setPositionLivreur({ lat: 14.7210, lng: -17.4620 });
        setStatut('en_route');
        setLivreurTel('221775550101');
      });

    // 2. Establish live telemetry socket listener for updates
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      addLog(lang === 'fr' ? 'Ligne de tracking en direct raccordée !' : 'Telemetry routing line active!');
      // Register client tracking token for order status updates & positioning updates
      socket.emit('join_commande', activeCommandeId);
    });

    // Handle coordinates update from the delivering driver
    socket.on('livreur:position', (data: { lat: number; lng: number }) => {
      addLog(`Mouvement GPS capté: lat ${data.lat.toFixed(5)}, lng ${data.lng.toFixed(5)}`);
      setPositionLivreur({ lat: data.lat, lng: data.lng });
      if (statut === 'recherche' || statut === 'assignee') {
        setStatut('en_route');
      }
    });

    // Handle delivery order status state updates
    socket.on('commande:status', (newStatus: string) => {
      addLog(`Changement de statut: ${newStatus}`);
      setStatut(newStatus);
    });

    return () => {
      socket.disconnect();
    };
  }, [activeCommandeId, lang]);

  // Dynamic OSRM routing calculations throttled to guard public API rate limiter (max 1 call per 8 seconds)
  useEffect(() => {
    if (!positionClient || !positionLivreur) return;

    const fetchOSRMRoute = async () => {
      const now = Date.now();
      // Only throttle if we already have an initial path, so the page loads the first OSRM line immediately!
      if (itineraire.length > 0 && now - lastRouteFetchTime.current < 8000) {
        return;
      }
      lastRouteFetchTime.current = now;

      try {
        const response = await axios.get('/api/route/optimisee', {
          params: {
            lat1: positionLivreur.lat,
            lng1: positionLivreur.lng,
            lat2: positionClient.lat,
            lng2: positionClient.lng
          }
        });
        const data = response.data;
        if (data && data.success) {
          // Standard/Normal route
          setItineraire(data.normal.geometry || []);
          setDistance(data.normal.distance_km || null);
          setEta(data.normal.duree_min || null);
          setEtaTrafic(data.normal.eta_trafic_min || data.normal.duree_min || null);
          setStatusTrafic('bouchon');
          setSourceEta('historique');
          setIsFallbackRoute(false);

          // Detour alternative route
          if (data.detour) {
            setDetourItineraire(data.detour.geometry || []);
            setDetourGainMin(data.detour.gain_min || null);
            setDetourGainPercent(data.detour.gain_percent || null);
            setDetourAxEvite(data.detour.ax_evite || '');
            setDetourDistance(data.detour.distance_km || null);
            setDetourEta(data.detour.eta_trafic_min || null);
          }
          
          addLog(lang === 'fr' 
            ? `Calcul OSRM optimisé : Standard ${data.normal.distance_km}km (${data.normal.eta_trafic_min} m) | Détour ${data.detour.distance_km}km (Gagne ${data.detour.gain_min} min !)`
            : `OSRM Optimal routing matched: Standard ${data.normal.distance_km}km (${data.normal.eta_trafic_min}m) | Bypass ${data.detour.distance_km}km (Saves ${data.detour.gain_min}m!)`
          );
        }
      } catch (err) {
        console.warn("Unable to fetch fresh precise routes:", err);
      }
    };

    fetchOSRMRoute();
  }, [positionClient, positionLivreur, lang, itineraire.length]);

  const handleSearchOrder = (e: FormEvent) => {
    e.preventDefault();
    const id = Number(commandeIdInput);
    if (isNaN(id) || id <= 0) {
      setError(lang === 'fr' ? 'Veuillez saisir un numéro de commande valide.' : 'Please type a valid order ID number.');
      return;
    }
    setActiveCommandeId(id);
  };

  // Compose and trigger WhatsApp link to reach courier
  const contacterLivreur = () => {
    if (!livreurTel) {
      setError(lang === 'fr' ? 'Le numéro de téléphone du livreur n\'est pas configuré.' : 'Drivers contact number was not loaded.');
      return;
    }
    const cleanPhone = livreurTel.replace(/\+/g, '').trim();
    const msg = lang === 'fr' 
      ? `Bonjour, je suis le client de la commande #${activeCommandeId}. Je suis vos déplacements sur la carte live ALGS !` 
      : `Hello, I am your customer for Order #${activeCommandeId}. Tracking you on the ALGS live map!`;
    
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Center coordinate resolver to keep Leaflet focus within the active delivery scope
  const cardCenter: [number, number] = positionLivreur 
    ? [positionLivreur.lat, positionLivreur.lng] 
    : positionClient 
      ? [positionClient.lat, positionClient.lng] 
      : [14.7167, -17.4677]; // Dakar fallback

  // Polyline coordinates array linking both coordinates
  const polylineCoords = positionClient && positionLivreur 
    ? [[positionClient.lat, positionClient.lng], [positionLivreur.lat, positionLivreur.lng]] 
    : [];

  return (
    <div className="space-y-6 animate-fade-in text-theme-text max-w-4xl mx-auto">
      
      {/* Title block */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent uppercase font-sans">
          {lang === 'fr' ? '🛰️ Suivi de Livraison Live' : '🛰️ Live Delivery Radar'}
        </h2>
        <p className="text-sm text-theme-text-secondary max-w-md mx-auto">
          {lang === 'fr'
            ? 'Regardez le livreur se déplacer en direct sur la carte vers votre adresse.'
            : 'Track your matched courier moving towards you on our geographical spatial telemetry.'}
        </p>
      </div>

      {/* Manual order finder search bar */}
      <form onSubmit={handleSearchOrder} className="bg-theme-card p-4 rounded-2xl border border-theme-border flex flex-col sm:flex-row gap-3 shadow-xl">
        <div className="flex-1 flex items-center gap-2 bg-theme-input px-3.5 py-2.5 rounded-xl border border-theme-border">
          <Search size={18} className="text-theme-text-secondary" />
          <input
            type="text"
            placeholder={lang === 'fr' ? 'Saisir un numéro de commande (ex: 1)' : 'Type order ID number (ex: 1)'}
            value={commandeIdInput}
            onChange={(e) => setCommandeIdInput(e.target.value)}
            className="bg-transparent border-none text-sm outline-none w-full text-theme-text focus:ring-0 placeholder:text-theme-text-muted"
          />
        </div>
        <button
          type="submit"
          className="bg-theme-text hover:bg-theme-text/90 text-theme-bg font-extrabold text-sm px-6 py-2.5 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <Compass size={16} />
          <span>{lang === 'fr' ? 'Rechercher' : 'Track Order'}</span>
        </button>
      </form>

      {/* Grid container: Status cards vs Leaflet Live Visual panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tracking states sidebar */}
        <div className="space-y-5 lg:col-span-1">
          
          {/* Active Command Tracker Details Card */}
          <div className="bg-theme-card p-5 rounded-3xl border border-theme-border shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border-thin pb-3">
              <span className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
                {lang === 'fr' ? 'Commande ciblée' : 'Tracking target'}
              </span>
              <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                #{activeCommandeId}
              </span>
            </div>

            {/* Status indicators */}
            <div className="space-y-4 text-xs">
              
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  ['recherche', 'assignee', 'en_route', 'livree'].includes(statut)
                    ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10'
                    : 'bg-theme-input text-theme-text-muted border border-theme-border'
                }`}>
                  <Clock size={14} />
                </div>
                <div>
                  <h5 className="font-bold text-theme-text">{lang === 'fr' ? '1. Validation & Recherche' : '1. Order Registered'}</h5>
                  <p className="text-[10px] text-theme-text-secondary">{lang === 'fr' ? 'Demande reçue et validée' : 'Checking nearest available drivers'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  ['assignee', 'en_route', 'livree'].includes(statut)
                    ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10'
                    : 'bg-theme-input text-theme-text-muted border border-theme-border'
                }`}>
                  <Check size={14} />
                </div>
                <div>
                  <h5 className="font-bold text-theme-text">{lang === 'fr' ? '2. Livreur Assigné' : '2. Driver Assigned'}</h5>
                  <p className="text-[10px] text-theme-text-secondary">{lang === 'fr' ? 'Mise en relation effectuée ✓' : 'Direct courier assigned via PostGIS ✓'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  ['en_route', 'livree'].includes(statut)
                    ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-500/10'
                    : 'bg-theme-input text-theme-text-muted border border-theme-border'
                }`}>
                  <Truck size={14} className={statut === 'en_route' ? 'animate-bounce' : ''} />
                </div>
                <div>
                  <h5 className="font-bold text-theme-text">{lang === 'fr' ? '3. En Route' : '3. En Route / Transit'}</h5>
                  <p className="text-[10px] text-theme-text-secondary">{lang === 'fr' ? 'Livreur en mouvement vers vous' : 'Moving courier tracked live'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  statut === 'livree'
                    ? 'bg-emerald-400 text-slate-900 shadow-md shadow-emerald-400/10'
                    : 'bg-theme-input text-theme-text-muted border border-theme-border'
                }`}>
                  <CheckCircle2 size={14} />
                </div>
                <div>
                  <h5 className="font-bold text-theme-text">{lang === 'fr' ? '4. Livrée' : '4. Handed Over / Completed'}</h5>
                  <p className="text-[10px] text-theme-text-secondary">{lang === 'fr' ? 'Remis en main propre' : 'Delivered and closed'}</p>
                </div>
              </div>

            </div>

            {/* Simulated controller actions strictly for live interactive tests */}
            <div className="border-t border-theme-border-thin pt-4 space-y-2">
              <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider block">
                {lang === 'fr' ? 'Simulateur d\'Étapes (Test rapide)' : 'Demo Sandbox Stage overrides'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setStatut('assignee')}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded border ${
                    statut === 'assignee' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-theme-input hover:bg-theme-card-hover text-theme-text-secondary border-theme-border'
                  }`}
                >
                  Matché ✓
                </button>
                <button
                  onClick={() => {
                    setStatut('en_route');
                    // Place real moving mock coordinate
                    if (positionClient) {
                      setPositionLivreur({
                        lat: positionClient.lat + 0.003,
                        lng: positionClient.lng - 0.003
                      });
                    }
                  }}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded border ${
                    statut === 'en_route' ? 'bg-sky-500/10 text-sky-450 border-sky-500/30' : 'bg-theme-input hover:bg-theme-card-hover text-theme-text-secondary border-theme-border'
                  }`}
                >
                  En route 🏍️
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await axios.post('/api/course/terminer', { commandeId: activeCommandeId });
                      if (res.data.success) {
                        setStatut('livree');
                        addLog(lang === 'fr' 
                          ? `🏁 Commande #${activeCommandeId} terminée ! Segment de trafic enregistré.` 
                          : `🏁 Order #${activeCommandeId} completed! Traffic segment logged successfully.`
                        );
                      }
                    } catch (err: any) {
                      console.error("Unable to conclude delivery:", err);
                    }
                  }}
                  className={`py-1.5 text-[10px] font-mono font-bold rounded border col-span-2 ${
                    statut === 'livree' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-theme-input hover:bg-theme-card-hover text-theme-text-secondary border-theme-border animate-pulse'
                  }`}
                >
                  {lang === 'fr' ? 'Livrée & Enregistrer segment 🏁' : 'Mark Delivered & Log segment 🏁'}
                </button>
              </div>
            </div>

          </div>

          {/* Quick contact trigger card */}
          {livreurTel && (
            <div className="bg-theme-card p-4 rounded-2xl border border-theme-border space-y-3">
              <span className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
                {lang === 'fr' ? 'Contacter votre coursier' : 'Interact with courier'}
              </span>
              <button
                onClick={contacterLivreur}
                className="w-full text-white bg-emerald-500 hover:bg-emerald-450 active:scale-[0.98] transition font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 border border-emerald-500/20"
              >
                <PhoneOutgoing size={14} />
                <span>{lang === 'fr' ? 'Lancer conversation WhatsApp' : 'Open WhatsApp chat'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Live Map Panel */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-theme-card p-5 rounded-3xl border border-theme-border shadow-2xl space-y-4 relative">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
                {lang === 'fr' ? 'Carte de Télémétrie Aéroportée' : 'Real-time Telemetry Tracking Map'}
              </span>
              {positionLivreur && (
                <span className="text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 font-bold text-emerald-400 animate-pulse px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Wifi size={12} />
                  {lang === 'fr' ? 'Signal GPS Capté' : 'Telemetry Live-Stream'}
                </span>
              )}
            </div>

            {/* ETA & Road Distance HUD Indicator with Adaptive Traffic Multiplier */}
            {eta !== null && distance !== null && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#161824] p-4.5 rounded-2xl border border-theme-border shadow-inner animate-fade-in text-sans">
                {/* Left Block: ETA with Traffic Coefficient */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={18} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                      {lang === 'fr' ? 'Arrivée Estimée (Trafic)' : 'Traffic-adjusted ETA'}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xl font-extrabold text-white">
                        ~ {etaTrafic} min
                      </span>
                      
                      {/* Interactive pill denoting live Dakar road traffic constraints */}
                      {statusTrafic === 'dense' && (
                        <span className="text-[9px] px-2 py-0.5 font-bold rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          {lang === 'fr' ? 'Trafic Dense' : 'Dense Traffic'}
                        </span>
                      )}
                      {statusTrafic === 'embouteillage' && (
                        <span className="text-[9px] px-2 py-0.5 font-bold rounded bg-rose-500/15 text-rose-400 border border-rose-500/20 animate-pulse">
                          {lang === 'fr' ? 'Embouteillages 🔴' : 'Bottleneck Traffic 🔴'}
                        </span>
                      )}
                      {statusTrafic === 'modéré' && (
                        <span className="text-[9px] px-2 py-0.5 font-bold rounded bg-sky-500/15 text-sky-450 border border-sky-500/20">
                          {lang === 'fr' ? 'Trafic Modéré' : 'Moderate Traffic'}
                        </span>
                      )}
                      {statusTrafic === 'fluide' && (
                        <span className="text-[9px] px-2 py-0.5 font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          {lang === 'fr' ? 'Fluide 🟢' : 'Free Flowing 🟢'}
                        </span>
                      )}

                      {sourceEta === 'historique' && (
                        <span className="text-[9px] px-2 py-0.5 font-bold rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                          {lang === 'fr' ? 'Moteur IA-Historique 🧠' : 'Historical Data-Engine 🧠'}
                        </span>
                      )}

                      {isFallbackRoute && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-normal shrink-0">
                          {lang === 'fr' ? 'Vol d\'oiseau' : 'As the crow flies'}
                        </span>
                      )}
                    </div>
                    {/* Footnote displaying underlying raw free-flowing routing time */}
                    <div className="text-[10px] text-slate-400 font-medium">
                      {lang === 'fr' 
                        ? `Sans embouteillage : ~ ${eta} min` 
                        : `Ideal free-flow : ~ ${eta} mins`
                      }
                    </div>
                  </div>
                </div>

                {/* Right Block: Telemetry Geographical distance & Refresh trigger */}
                <div className="flex items-start justify-between border-t md:border-t-0 md:border-l border-theme-border-thin pt-3.5 md:pt-0 md:pl-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Navigation size={18} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        {lang === 'fr' ? 'Distance Routière' : 'Road Distance'}
                      </span>
                      <span className="text-xl font-extrabold text-white block">
                        {distance} km
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {lang === 'fr' ? 'Parcours routier le plus court' : 'Shortest path over road network'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={forceRecalculateRoute}
                    title={lang === 'fr' ? 'Actualiser l\'itinéraire' : 'Refresh routing path'}
                    className="p-2 rounded-xl bg-theme-input text-theme-text-secondary hover:text-emerald-450 border border-theme-border-thin flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer mt-0.5"
                  >
                    <Compass size={15} className="hover:rotate-90 duration-300 transition-all text-emerald-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Detour Recommendation Banner with Time Savings statistics */}
            {detourGainMin !== null && detourGainMin > 0 && (
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in text-sans">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-orange-500/15 text-orange-400 rounded-xl mt-0.5 sm:mt-0 animate-pulse">
                    <Sparkles size={16} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                      <span>{lang === 'fr' ? '🚦 Alternative de Contournement Détectée' : '🚦 Faster Detour Detected'}</span>
                      <span className="bg-orange-500/25 text-white text-[9px] px-1.5 py-0.5 rounded font-black font-mono">
                        -{detourGainMin} MIN !
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      {lang === 'fr'
                        ? `En contournant l'embouteillage sur ${detourAxEvite}, gagnez jusqu'à ${detourGainMin} min (-${detourGainPercent}%).`
                        : `By bypassing the heavy congestion on ${detourAxEvite}, save up to ${detourGainMin} mins (-${detourGainPercent}%).`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <button
                    onClick={() => setShowDetourOption(!showDetourOption)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      showDetourOption
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-800 border-slate-700 text-slate-400"
                    }`}
                  >
                    {showDetourOption 
                      ? (lang === 'fr' ? 'Tracé Activé ✓' : 'Bypass Route Active ✓') 
                      : (lang === 'fr' ? 'Afficher le Détour' : 'Display Bypass Path')
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Geographical Interactive Map Stage */}
            <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-theme-border relative shadow-lg bg-theme-input z-10">
              <MapContainer
                center={cardCenter}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Client point location */}
                {positionClient && (
                  <Marker position={[positionClient.lat, positionClient.lng]} icon={clientIcon}>
                    <Popup>
                      <div className="font-sans text-xs">
                        <p className="font-bold text-slate-800">{lang === 'fr' ? '📍 Mon point de livraison' : '📍 Target delivery location'}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Driver live locator marker */}
                {positionLivreur && (
                  <Marker position={[positionLivreur.lat, positionLivreur.lng]} icon={livreurIcon}>
                    <Popup>
                      <div className="font-sans text-xs">
                        <p className="font-bold text-red-650">🏍️ {lang === 'fr' ? 'Votre coursier ALGS' : 'Your match driver'}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Position synchronisée en live</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* 1. Base standard route (rendered in thin dashed red outline to symbolize the congestion on standard road paths) */}
                {itineraire && itineraire.length > 0 && (
                  <Polyline 
                    positions={itineraire as [number, number][]} 
                    color="#ef4444" 
                    weight={4} 
                    dashArray="6, 6"
                    lineJoin="round"
                    lineCap="round"
                  />
                )}

                {/* 2. Optimized bypass detour route (vibrant Solid Green line symbolizing rapid travel options) */}
                {detourItineraire && detourItineraire.length > 0 && showDetourOption && (
                  <Polyline 
                    positions={detourItineraire as [number, number][]} 
                    color="#10b981" 
                    weight={6} 
                    lineJoin="round"
                    lineCap="round"
                  />
                )}

                {/* Straight line fallback drawing block */}
                {(!itineraire || itineraire.length === 0) && polylineCoords.length > 0 && (
                  <Polyline 
                    positions={polylineCoords as [number, number][]} 
                    color="#f59e0b" 
                    dashArray="5, 10" 
                    weight={3} 
                  />
                )}

              </MapContainer>
            </div>

            {/* Notifications and logs area */}
            {error && (
              <div className="flex gap-2 text-xs text-red-400 bg-red-400/5 p-3 rounded-xl border border-red-500/20">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <p className="font-sans">{error}</p>
              </div>
            )}

            {/* Visual tip overlay */}
            <div className="p-3 bg-theme-input rounded-2xl border border-theme-border-thin flex items-center gap-2.5">
              <Sparkles className="text-emerald-400 shrink-0" size={16} />
              <p className="text-[11px] text-theme-text-secondary leading-relaxed font-sans">
                {lang === 'fr'
                  ? "💡 Pour tester les mouvements d’aiguilles en live, ouvrez un deuxième navigateur avec l'onglet 'Livreur Télémétrie' puis lancez le simulateur GPS !"
                  : "💡 Multi-user test: Keep this page open, open another browser window on the 'Driver Telemetry' tab, and actuate the Green tracking switch!"}
              </p>
            </div>

          </div>

          {/* Activity trace logs */}
          <div className="bg-[#12131a] p-4 rounded-3xl border border-theme-border font-mono text-[10px] space-y-2">
            <span className="text-slate-500 font-bold tracking-wider uppercase">{lang === 'fr' ? '📟 Flux de Télémétrie Live' : '📟 live logs'}</span>
            <div className="space-y-1">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} className="text-slate-400 flex gap-2">
                    <span className="text-emerald-500 shrink-0">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-theme-text-muted italic">{lang === 'fr' ? 'En attente d\'activité...' : 'Waiting for activity...'}</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
