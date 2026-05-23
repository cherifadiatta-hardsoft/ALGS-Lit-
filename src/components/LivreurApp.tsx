import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io, { Socket } from 'socket.io-client';
import L from 'leaflet';
import axios from 'axios';
import { 
  Wifi, 
  WifiOff, 
  MapPin, 
  Truck, 
  AlertCircle, 
  BadgeAlert, 
  CheckCircle2, 
  Check, 
  ChevronRight, 
  Navigation, 
  PhoneCall, 
  PhoneOutgoing, 
  UserCheck,
  Lock,
  Camera,
  FileText,
  ShieldCheck,
  Sparkles,
  Info,
  ArrowRight,
  RotateCcw,
  FileCheck,
  Smartphone
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

interface Course {
  commandeId: number;
  client_nom?: string;
  client_tel?: string;
  lat: number;
  lng: number;
}

interface LivreurAppProps {
  lang: 'fr' | 'en';
}

const TRAINING_QUESTIONS = [
  {
    id: 1,
    questionFr: "Quelle est la règle de priorité dans un rond-point à Dakar (ex: Place de l'Indépendance) ?",
    questionEn: "What is the priority rule in a Dakar roundabout (e.g. Place de l'Indépendance)?",
    optionsFr: [
      "Priorité à droite (véhicules entrants)",
      "Priorité aux véhicules déjà engagés dans le rond-point",
      "Priorité au conducteur le plus rapide ou le plus gros"
    ],
    optionsEn: [
      "Priority to the right (entering vehicles)",
      "Priority to vehicles already inside the roundabout",
      "Priority to the largest or fastest vehicle"
    ],
    correctAnswerIndex: 1
  },
  {
    id: 2,
    questionFr: "Que devez-vous faire si le client vous demande de livrer à une adresse différente sur WhatsApp ?",
    questionEn: "What should you do if the customer requests a delivery redirection via WhatsApp?",
    optionsFr: [
      "Refuser catégoriquement la course et s'en aller",
      "Livrer immédiatement à la nouvelle adresse sans en informer l'application",
      "Informer le support ALGS dans l'application pour réajuster l'itinéraire et le tarif"
    ],
    optionsEn: [
      "Refuse the delivery completely and walk away",
      "Deliver straight to the new address without telling the app support",
      "Alert ALGS support in-app to dynamically update route & shipping fees"
    ],
    correctAnswerIndex: 2
  },
  {
    id: 3,
    questionFr: "En cas d'embouteillage lourd détecté (ex: Boulevard de la République), que propose l'algorithme ?",
    questionEn: "If heavy congestion is flagged (e.g., Boulevard de la République), what does the algorithm suggest?",
    optionsFr: [
      "Un détour optimisé de contournement latéral (ex: à 500m perpendiculaire)",
      "D'attendre sur le trottoir que le trafic se calme",
      "De rebrousser chemin et d'annuler la commande"
    ],
    optionsEn: [
      "A lateral perpendicular bypassing detour offset (e.g. 500m away)",
      "Wait on the sidewalk until traffic clears out",
      "Turn back and cancel the shipment directly"
    ],
    correctAnswerIndex: 0
  },
  {
    id: 4,
    questionFr: "Quelle est la vitesse maximale recommandée en ville à Dakar pour effectuer une livraison sécurisée ?",
    questionEn: "What is the recommended urban speed limit in Dakar for safe high-performance deliveries?",
    optionsFr: [
      "80 km/h pour arriver le plus vite possible",
      "Entre 30 km/h et 40 km/h selon le trafic urbain",
      "10 km/h pour ne prendre aucun risque"
    ],
    optionsEn: [
      "80 km/h to deliver as fast as humanly possible",
      "Between 30 km/h and 40 km/h adjusted for traffic and safety",
      "10 km/h to eliminate any potential motion risks"
    ],
    correctAnswerIndex: 1
  },
  {
    id: 5,
    questionFr: "Pourquoi est-il crucial de garder le partage GPS actif pendant toute la durée de la course ?",
    questionEn: "Why is streaming continuous GPS location critical during the delivery journey?",
    optionsFr: [
      "Pour que le client et l'algorithme de routage OSRM suivent en live de manière fluide",
      "Pour décharger la batterie du téléphone plus rapidement",
      "Cela n'a pas d'importance, on peut le couper à tout moment"
    ],
    optionsEn: [
      "To allow the customer and OSRM routing dispatchers to monitor the delivery live",
      "To drain the smartphone battery as quickly as possible",
      "It has zero importance, you can disconnect whenever you want"
    ],
    correctAnswerIndex: 0
  }
];

export default function LivreurApp({ lang }: LivreurAppProps) {
  // Navigation & View contexts
  const [currentMode, setCurrentMode] = useState<'onboarding' | 'telemetry'>('telemetry');
  
  // Standard approved driver selector context
  const [livreurId, setLivreurId] = useState<string>('1'); 
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [enLigne, setEnLigne] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Onboarding registration state flow (4 steps)
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardId, setOnboardId] = useState<string | null>(null);
  
  // Step 1 values
  const [regPhone, setRegPhone] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpExpected, setOtpExpected] = useState<string>('');
  
  // Step 2 values
  const [prenom, setPrenom] = useState<string>('');
  const [nomFamille, setNomFamille] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [cniFile, setCniFile] = useState<string>('');
  const [selfieFile, setSelfieFile] = useState<string>('');

  // Step 3 values
  const [vehicleType, setVehicleType] = useState<'velo' | 'moto' | 'voiture'>('moto');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [insuranceFile, setInsuranceFile] = useState<string>('');
  const [vehicleFile, setVehicleFile] = useState<string>('');

  // Step 4 values (Exam answers)
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean } | null>(null);

  // Administrative dynamic database status of the currently selected driver ID
  const [driverInfo, setDriverInfo] = useState<any>(null);

  const socketRef = useRef<Socket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Add automated logs
  const addLog = (msg: string) => {
    setDebugLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Re-connect to websocket dynamically when the active driver id changes
  useEffect(() => {
    const socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      addLog(lang === 'fr' ? 'Connexion WebSocket établie !' : 'WebSocket connection established!');
      socket.emit('join_livreur', Number(livreurId));
    });

    socket.on('connect_error', (err) => {
      console.error(err);
      addLog(`Socket Error: ${err.message}`);
    });

    socket.on('nouvelle_course', (data: Course) => {
      console.log('Nouvelle course reçue:', data);
      setCourse(data);
      addLog(
        lang === 'fr' 
          ? `🔥 Nouvelle course reçue pour la commande #${data.commandeId} !`
          : `🔥 New delivery match assigned for Order #${data.commandeId}!`
      );
      setSuccess(
        lang === 'fr'
          ? `Nouvelle commande reçue de la part de ${data.client_nom || 'Client'} !`
          : `New order matched from ${data.client_nom || 'Client'}!`
      );
    });

    socket.on('disconnect', () => {
      addLog(lang === 'fr' ? 'WebSocket déconnecté.' : 'Websocket disconnected.');
    });

    // Fetch the active driver database/mock records instantly to align kyc status
    fetchDriverStatus(livreurId);

    return () => {
      socket.disconnect();
    };
  }, [livreurId, lang]);

  // Clean-up geolocation watches on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch driver kyc status from server
  const fetchDriverStatus = async (targetId: string) => {
    try {
      const resp = await axios.get(`/api/driver/status/${targetId}`);
      if (resp.data && resp.data.success) {
        setDriverInfo(resp.data.driver);
        // If driver is offline and we have online set, override
        if (resp.data.driver.kyc_status !== 'approved') {
          setEnLigne(false);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch standard driver onboarding status:", err);
    }
  };

  // Set-up/Toggle Real-Time continuous GPS position broadcast
  const toggleEnLigne = () => {
    setError('');
    setSuccess('');

    // Gatekeeper: Reject going online if KYC is not approved!
    if (driverInfo && driverInfo.kyc_status !== 'approved') {
      setError(
        lang === 'fr'
          ? "⚠️ Accès refusé : Votre dossier KYC est en attente ou rejeté. Veuillez d'abord valider l'onboarding."
          : "⚠️ Access Denied: Your KYC file is pending or rejected. Please complete onboarding first."
      );
      return;
    }

    if (enLigne) {
      // Stopper le tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setEnLigne(false);
      addLog(lang === 'fr' ? 'Vous êtes hors ligne' : 'You are now offline.');
    } else {
      if (!navigator.geolocation) {
        setError(
          lang === 'fr' 
            ? 'La géolocalisation n’est pas supportée par votre navigateur.' 
            : 'Geolocation is not supported by your browser.'
        );
        return;
      }

      // Initial query coordinates immediately
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(coords);
          
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('update_position', {
              livreurId: Number(livreurId),
              lat: coords.lat,
              lng: coords.lng
            });
            addLog(lang === 'fr' ? 'Coordonnées initiales envoyées !' : 'Initial spatial coordinates streamed!');
          }
        },
        (err) => {
          console.error(err);
          setError(
            lang === 'fr'
              ? 'Erreur GPS : Accès refusé ou indisponible.'
              : 'GPS Error: Access denied or unavailable.'
          );
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );

      // Setup continuous watcher
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          };
          setPosition(coords);
          
          // Send to server
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('update_position', {
              livreurId: Number(livreurId),
              lat: coords.lat,
              lng: coords.lng
            });
            addLog(`Gps update streamed: Lat ${coords.lat.toFixed(5)}, Lng ${coords.lng.toFixed(5)}`);
          }
        },
        (err) => {
          console.error(err);
          addLog(`GPS watch failed: ${err.message}`);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000,
          maximumAge: 0 
        }
      );
      
      setEnLigne(true);
      addLog(lang === 'fr' ? 'Vous êtes en ligne (Flux GPS actif ✓)' : 'You are online (Continuous telemetry active ✓)');
    }
  };

  // Open WhatsApp link targeting the client
  const contacterClient = () => {
    if (!course || !position) return;
    
    // Clean recipient phone
    const clientTelClean = (course.client_tel || '').replace(/\+/g, '').trim();
    if (!clientTelClean) {
      setError(lang === 'fr' ? 'Numéro de téléphone du client manquant.' : 'Client telephone format is missing.');
      return;
    }

    const msg = lang === 'fr'
      ? `Bonjour *${course.client_nom || 'Client ALGS'}*, je suis votre livreur assigné.\n\n📍 *Suivez mes déplacements en temps réel*:\nhttps://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}#map=16/${position.lat}/${position.lng}\n\nÀ tout de suite !`
      : `Hello *${course.client_nom || 'ALGS Client'}*, I am your matched delivery driver.\n\n📍 *Track my progress in real-time here*:\nhttps://www.openstreetmap.org/?mlat=${position.lat}&mlon=${position.lng}#map=16/${position.lat}/${position.lng}\n\nSee you soon!`;

    window.open(`https://wa.me/${clientTelClean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- ACTIONS FOR NEW DRIVER ONBOARDING FLOW ---

  // OTP request action
  const handleRequestOtp = async () => {
    setError('');
    setSuccess('');
    if (!regPhone.trim()) {
      setError(lang === 'fr' ? 'Veuillez saisir votre numéro.' : 'Please enter your phone number.');
      return;
    }

    try {
      const resp = await axios.post('/api/driver/verify-phone', { telephone: regPhone });
      if (resp.data && resp.data.success) {
        setOnboardId(resp.data.driverId.toString());
        setOtpExpected(resp.data.otpCode);
        setOtpSent(true);
        setSuccess(
          lang === 'fr'
            ? `Code OTP envoyé ! Saisir le code d'essai '${resp.data.otpCode}'`
            : `Simulated OTP Sent! Input test vector code: '${resp.data.otpCode}'`
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // OTP validation action
  const handleVerifyOtp = async () => {
    setError('');
    setSuccess('');
    if (!otpCode.trim() || !onboardId) return;

    try {
      const resp = await axios.post('/api/driver/verify-otp', {
        driverId: onboardId,
        code: otpCode
      });
      if (resp.data && resp.data.success) {
        setSuccess(lang === 'fr' ? 'Numéro vérifié avec succès !' : 'Phone validated successfully!');
        setOnboardingStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Save personal KYC action
  const handleSaveKyc = async () => {
    setError('');
    setSuccess('');
    if (!prenom.trim() || !nomFamille.trim() || !email.trim()) {
      setError(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires.' : 'Please fill all mandatory fields.');
      return;
    }

    try {
      const resp = await axios.post('/api/driver/kyc-info', {
        driverId: onboardId,
        prenom,
        nom_famille: nomFamille,
        email,
        cni_url: cniFile || 'CNI_UPLOAD_SUCCESSFUL',
        selfie_url: selfieFile || 'SELFIE_CAPTURE_SUCCESSFUL'
      });
      if (resp.data && resp.data.success) {
        setSuccess(lang === 'fr' ? 'Profil et documents KYC sauvegardés !' : 'Personal KYC metadata successfully uploaded.');
        setOnboardingStep(3);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Save Vehicle profile action
  const handleSaveVehicle = async () => {
    setError('');
    setSuccess('');

    // Only moto and voiture need a plate number and insurance copy
    if (vehicleType !== 'velo') {
      if (!vehiclePlate.trim()) {
        setError(lang === 'fr' ? 'La plaque d\'immatriculation est obligatoire pour ce véhicule.' : 'Plate registration number is required.');
        return;
      }
    }

    try {
      const resp = await axios.post('/api/driver/vehicle-info', {
        driverId: onboardId,
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate,
        insurance_url: insuranceFile || 'INSURANCE_DOC_OK',
        vehicle_photo_url: vehicleFile || 'VEHICLE_PHOTO_OK'
      });
      if (resp.data && resp.data.success) {
        setSuccess(
          lang === 'fr' 
            ? 'Spécificités du véhicule configurées avec succès !' 
            : 'Vehicle parameters configured successfully!'
        );
        setOnboardingStep(4);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Submit Training Exam Answers
  const handleSelectAnswer = (qId: number, optionIdx: number) => {
    setExamAnswers(prev => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitExam = async () => {
    setError('');
    setSuccess('');
    
    // Check if answered all
    if (Object.keys(examAnswers).length < TRAINING_QUESTIONS.length) {
      setError(
        lang === 'fr' 
          ? 'Veuillez répondre à toutes les questions avant de valider.' 
          : 'Please answer all training exam questions first.'
      );
      return;
    }

    // Process score
    let correctCount = 0;
    TRAINING_QUESTIONS.forEach(q => {
      if (examAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const finalPercent = (correctCount / TRAINING_QUESTIONS.length) * 100;
    const hasPassed = finalPercent >= 80; // Pass mark is 80%

    try {
      const resp = await axios.post('/api/driver/submit-test', {
        driverId: onboardId,
        score: finalPercent
      });

      if (resp.data && resp.data.success) {
        setExamResult({ score: finalPercent, passed: hasPassed });
        if (hasPassed) {
          setSuccess(
            lang === 'fr'
              ? 'Félicitations ! Vous avez réussi le test et votre compte est approuvé !'
              : 'Congratulations! You passed the quick training test and your account is approved!'
          );
          // Set active logging context directly to this new driver!
          if (onboardId) {
            setLivreurId(onboardId);
          }
        } else {
          setError(
            lang === 'fr'
              ? `Score : ${finalPercent}% (${correctCount}/5). Vous devez obtenir au moins 80% (4 réponses correctes). Veuillez réessayer !`
              : `Score: ${finalPercent}% (${correctCount}/5). You must score at least 80% (4 correct answers) to pass. Please retry!`
          );
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleRetryExam = () => {
    setExamAnswers({});
    setExamResult(null);
    setError('');
  };

  // Admin Direct bypass approval toggle
  const handleAdminBypassApproval = async (status: 'approved' | 'pending') => {
    setError('');
    setSuccess('');
    const targetId = currentMode === 'onboarding' ? onboardId : livreurId;
    if (!targetId) {
      setError("Aucun livreur sélectionné.");
      return;
    }

    try {
      const resp = await axios.post('/api/driver/admin-bypass', {
        driverId: targetId,
        kyc_status: status
      });
      if (resp.data && resp.data.success) {
        setSuccess(`[ADMIN] Statut KYC forcé à : ${status}`);
        if (currentMode === 'telemetry') {
          fetchDriverStatus(livreurId);
        } else {
          // Unlocks step 5 / automatic skip if they bypass during onboarding
          setExamResult({ score: 100, passed: status === 'approved' });
          if (status === 'approved') {
            setLivreurId(targetId);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-theme-text">

      {/* Interface Segment Mode Switch Toggle */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl max-w-md mx-auto shadow-inner">
        <button
          onClick={() => {
            setCurrentMode('telemetry');
            fetchDriverStatus(livreurId);
          }}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentMode === 'telemetry'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Wifi size={14} />
          {lang === 'fr' ? '1. Espace Télémétrie' : '1. Telemetry Space'}
        </button>
        <button
          onClick={() => setCurrentMode('onboarding')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            currentMode === 'onboarding'
              ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Sparkles size={14} />
          {lang === 'fr' ? "2. S'inscrire (Onboarding)" : "2. Register (Onboarding)"}
        </button>
      </div>
      
      {/* -------------------- TELEMETRY ESPACE VIEW -------------------- */}
      {currentMode === 'telemetry' && (
        <>
          {/* Telemetry Status indicator bar */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-theme-card p-5 rounded-3xl border border-theme-border shadow-xl">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${enLigne ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {enLigne ? <Wifi size={24} className="animate-pulse" /> : <WifiOff size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${enLigne ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
                  <h4 className="font-extrabold text-sm uppercase tracking-wide">
                    {enLigne ? (lang === 'fr' ? 'Statut : DISPONIBLE' : 'Status: ONLINE') : (lang === 'fr' ? 'Statut : HORS LIGNE' : 'Status: OFFLINE')}
                  </h4>
                </div>
                <p className="text-xs text-theme-text-secondary mt-0.5">
                  {driverInfo && driverInfo.kyc_status !== 'approved' ? (
                    <span className="text-orange-450 font-semibold flex items-center gap-1">
                      <Lock size={12} /> {lang === 'fr' ? 'KYC Incomplet ou en attente' : 'KYC Pending or unapproved'}
                    </span>
                  ) : enLigne ? (
                    lang === 'fr' ? 'Moteur de télémétrie Socket.IO synchronisé.' : 'Socket.IO spatial telemetry active.'
                  ) : (
                    lang === 'fr' ? 'Prêt à recevoir des courses.' : 'Ready to accept dispatches.'
                  )}
                </p>
              </div>
            </div>

            {/* Driver context changer */}
            <div className="flex items-center gap-2 bg-theme-input px-3 py-2 border border-theme-border rounded-2xl">
              <label className="text-[10px] font-bold text-theme-text-secondary uppercase tracking-wider font-sans">
                ID {lang === 'fr' ? 'Livreur :' : 'Driver :'}
              </label>
              <select 
                value={livreurId} 
                onChange={(e) => {
                  setLivreurId(e.target.value);
                  addLog(`Switched driver context to ID #${e.target.value}`);
                }}
                className="bg-transparent text-xs font-bold font-mono text-emerald-400 outline-none cursor-pointer border-none p-0 focus:ring-0"
              >
                <option value="1" className="bg-theme-bg text-theme-text">#1 - Moussa Diop (Moto - En Ligne)</option>
                <option value="2" className="bg-theme-bg text-theme-text">#2 - Awa Ndiaye (Moto - En Ligne)</option>
                <option value="3" className="bg-theme-bg text-theme-text">#3 - Amadou Diallo (Moto - En Ligne)</option>
                <option value="4" className="bg-theme-bg text-theme-text">#4 - Fatou Sow (Voiture - Hors Ligne)</option>
                {onboardId && onboardId !== "1" && onboardId !== "2" && onboardId !== "3" && onboardId !== "4" && (
                  <option value={onboardId} className="bg-theme-bg text-theme-text font-black text-orange-400">
                    #{onboardId} - {prenom || 'Nouveau Livreur'} ({vehicleType.toUpperCase()})
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Quick Informative Banner indicating active KYC properties */}
          {driverInfo && (
            <div className="bg-theme-card border border-theme-border p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className={driverInfo.kyc_status === 'approved' ? "text-emerald-400" : "text-amber-500"} />
                <div className="space-y-0.5">
                  <p className="font-bold text-white">
                    {driverInfo.nom || 'Livreur en enregistrement'} 
                    <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded ml-2 uppercase">
                      {driverInfo.vehicule || 'moto'}
                    </span>
                  </p>
                  <p className="text-theme-text-secondary text-[10px]">
                    CNI: {driverInfo.cni_url ? `Dossier déposé (CNI)` : `Non envoyé`} | 
                    Plaque: {driverInfo.plate_number || 'Non enregistrée'}
                  </p>
                </div>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide block text-center ${
                  driverInfo.kyc_status === 'approved' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {driverInfo.kyc_status === 'approved' 
                    ? (lang === 'fr' ? '✓ Profil Approuvé' : '✓ KYC Approved') 
                    : (lang === 'fr' ? '⧗ Onboarding Nécessaire' : '⧗ Unfinished Onboarding')}
                </span>
              </div>
            </div>
          )}

          {/* Primary Driver Telemetry Panel */}
          <div className="bg-theme-card p-6 rounded-3xl border border-theme-border space-y-5 shadow-2xl backdrop-blur-md">
            
            {/* Toggle Online status button */}
            <button
              onClick={toggleEnLigne}
              className={`w-full py-4 px-6 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer select-none border shadow-lg ${
                enLigne 
                  ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-550 hover:to-red-600 border-red-500/30 shadow-red-500/10'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-500 border-emerald-500/30 shadow-emerald-500/10'
              }`}
            >
              <Truck size={20} className="animate-bounce" />
              <span>
                {enLigne 
                  ? (lang === 'fr' ? '🔴 Stopper le partage GPS' : '🔴 Disconnect / Go Offline')
                  : (lang === 'fr' ? '🟢 Commencer - Se mettre en ligne' : '🟢 Connect / Go Online')}
              </span>
            </button>

            {/* Error notifications */}
            {error && (
              <div className="flex gap-2 text-sm text-red-550 bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl animate-fade-in">
                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
                <p className="text-xs leading-relaxed font-sans text-red-400">{error}</p>
              </div>
            )}

            {/* Success notifications */}
            {success && (
              <div className="flex gap-2 text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl animate-fade-in">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-sans">{success}</p>
              </div>
            )}

            {/* Live position viewer */}
            {position && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider block">
                  {lang === 'fr' ? "Ma Position temps réel (Leaflet Map) :" : "My Real-Time position (Leaflet Map) :"}
                </span>
                <div className="w-full h-64 rounded-2xl overflow-hidden border border-theme-border relative shadow-lg bg-theme-input z-10">
                  <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[position.lat, position.lng]}>
                      <Popup>
                        <span className="font-sans font-semibold text-xs text-slate-800">
                          {lang === 'fr' ? 'Votre position actuelle' : 'Your current position'}
                        </span>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Active deliveries matches overlay */}
            {course ? (
              <div className="bg-amber-500/5 p-5 border-2 border-amber-500/30 rounded-2xl space-y-4 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full bg-amber-500/[0.03] blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between pb-2 border-b border-theme-border-thin">
                  <h4 className="font-extrabold text-amber-500 uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <BadgeAlert size={16} className="animate-pulse" />
                    {lang === 'fr' ? 'Course active trouvée !' : 'Active match found!'}
                  </h4>
                  <span className="font-mono text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-0.5 border border-amber-500/20 rounded font-bold">
                    CMD #{course.commandeId}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-theme-text-secondary leading-normal">
                  <div className="flex justify-between">
                    <span>{lang === 'fr' ? 'Client' : 'Customer'}</span>
                    <span className="font-bold text-theme-text">{course.client_nom || 'Client ALGS'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'fr' ? 'Téléphone' : 'Contact'}</span>
                    <span className="font-mono font-bold text-theme-text">{course.client_tel || 'Inconnu'}</span>
                  </div>
                </div>

                <button
                  onClick={contacterClient}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-450 active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-emerald-500/15 cursor-pointer"
                >
                  <PhoneOutgoing size={16} />
                  <span>{lang === 'fr' ? 'Contacter le client sur WhatsApp' : 'Contact client on WhatsApp'}</span>
                </button>
              </div>
            ) : (
              !enLigne && (
                <p className="text-center text-xs text-theme-text-muted leading-relaxed font-sans max-w-sm mx-auto">
                  {lang === 'fr'
                    ? "Mettez-vous en ligne ci-dessus pour activer la recherche de proximité et recevoir des courses instantanément."
                    : "Go online above to enable nearby proximity queries & receive automated delivery dispatches instantly."}
                </p>
              )
            )}
          </div>
        </>
      )}

      {/* -------------------- DYNAMIC 4-STEP ONBOARDING VIEW -------------------- */}
      {currentMode === 'onboarding' && (
        <div className="bg-theme-card p-6 md:p-8 rounded-3xl border border-theme-border space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
          
          {/* Header */}
          <div className="space-y-1.5 border-b border-theme-border pb-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="text-orange-400" size={20} />
              {lang === 'fr' ? "Devenir Livreur Premium ALGS" : "Enroll as an ALGS Premium Driver"}
            </h3>
            <p className="text-xs text-theme-text-secondary">
              {lang === 'fr'
                ? "Inscrivez-vous en 4 étapes simples et commencez à encaisser vos gains sur Dakar."
                : "Complete our four simple onboarding steps to unlock real-time orders immediately."}
            </p>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="grid grid-cols-4 gap-2 relative">
            {[1, 2, 3, 4].map((step) => {
              const isActive = step === onboardingStep;
              const isPassed = step < onboardingStep;
              return (
                <div key={step} className="space-y-2">
                  <div className={`h-1.5 rounded-full transition-all duration-500 ${
                    isActive ? 'bg-orange-500' : isPassed ? 'bg-emerald-500' : 'bg-slate-800'
                  }`} />
                  <span className={`text-[10px] block font-bold transition-colors duration-300 text-center ${
                    isActive ? 'text-orange-400' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {step === 1 && (lang === 'fr' ? 'Tél & OTP' : 'SMS Auth')}
                    {step === 2 && (lang === 'fr' ? 'Profil/KYC' : 'KYC ID')}
                    {step === 3 && (lang === 'fr' ? 'Véhicule' : 'Vehicle')}
                    {step === 4 && (lang === 'fr' ? 'Quizz' : 'Training')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Error / Success feedback */}
          {error && (
            <div className="flex gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3.5 rounded-2xl animate-fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed font-sans">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl animate-fade-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <p className="text-xs leading-relaxed font-sans">{success}</p>
            </div>
          )}

          {/* --- STEP 1: Téléphone OTP --- */}
          {onboardingStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-orange-500/5 border border-orange-500/15 rounded-2xl flex items-start gap-3">
                <Smartphone className="text-orange-400 mt-0.5 shrink-0" size={18} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{lang === 'fr' ? "Étape 1 : Vérification Téléphone" : "Step 1: Phone Authentication"}</h4>
                  <p className="text-[11px] text-theme-text-secondary leading-normal">
                    {lang === 'fr' 
                      ? "Saisissez votre numéro de portable pour créer votre dossier ou reprendre votre inscription suspendue."
                      : "Enter your mobile phone number to initialize your record or resume dynamic onboarding."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "Téléphone (ex: 22177...)" : "Phone (e.g. 22177...)"}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="221775550109"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      disabled={otpSent}
                      className="flex-1 bg-theme-input border border-theme-border hover:border-slate-700 outline-none rounded-2xl px-4 py-3 text-sm font-mono text-white placeholder-slate-500 transition focus:border-orange-500 focus:ring-0"
                    />
                    {!otpSent && (
                      <button
                        onClick={handleRequestOtp}
                        className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold font-sans px-5 rounded-2xl transition cursor-pointer"
                      >
                        {lang === 'fr' ? 'Recevoir OTP' : 'Get OTP'}
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="p-3 bg-[#12131a] border border-slate-800 rounded-xl flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">OTP Code (Demo Sandbox) :</span>
                      <span className="text-orange-400 font-bold">{otpExpected}</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "Code de vérification (Saisir 12345)" : "Verification OTP (Input 12345)"}</label>
                      <input
                        type="text"
                        placeholder="12345"
                        maxLength={5}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full bg-theme-input border border-theme-border outline-none rounded-2xl px-4 py-3 text-sm font-mono text-white text-center tracking-widest transition focus:border-orange-500 focus:ring-0"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => { setOtpSent(false); setOtpCode(''); }}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RotateCcw size={14} /> {lang === 'fr' ? 'Modifier' : 'Edit Phone'}
                      </button>
                      <button
                        onClick={handleVerifyOtp}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-450 hover:to-orange-500 text-white rounded-2xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> {lang === 'fr' ? 'Valider le code' : 'Verify Code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- STEP 2: Profil & KYC identity uploads --- */}
          {onboardingStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-orange-500/5 border border-orange-500/15 rounded-2xl flex items-start gap-3">
                <FileText className="text-orange-400 mt-0.5 shrink-0" size={18} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{lang === 'fr' ? "Étape 2 : Identité & KYC" : "Step 2: Identity & KYC Details"}</h4>
                  <p className="text-[11px] text-theme-text-secondary leading-normal">
                    {lang === 'fr' 
                      ? "Renseignez vos informations légales et chargez une photo nette de votre carte d'identité nationale (CNI) ainsi qu'un selfie."
                      : "Please submit your legal name, email, and simple mock uploads of both your CNI physical ID card and a selfie."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "Prénom" : "First Name"}</label>
                  <input
                    type="text"
                    required
                    placeholder="Mamadou"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border outline-none rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 placeholder-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "Nom de famille" : "Last Name"}</label>
                  <input
                    type="text"
                    required
                    placeholder="Sarr"
                    value={nomFamille}
                    onChange={(e) => setNomFamille(e.target.value)}
                    className="w-full bg-theme-input border border-theme-border outline-none rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "E-mail professionnel" : "Email Address"}</label>
                <input
                  type="email"
                  required
                  placeholder="mamadou@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-theme-input border border-theme-border outline-none rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 placeholder-slate-500 font-mono"
                />
              </div>

              {/* Mock drag & drop uploaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* CNI Upload Box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "Photo CNI Recto/Verso" : "CNI National ID Card"}</label>
                  <div 
                    onClick={() => setCniFile(prenom ? `CNI_${prenom.toUpperCase()}.png` : "CNI_RIDER.png")}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition select-none flex flex-col items-center justify-center gap-2 ${
                      cniFile 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                        : 'bg-theme-input border-theme-border hover:border-slate-700'
                    }`}
                  >
                    {cniFile ? (
                      <>
                        <CheckCircle2 size={24} className="text-emerald-400" />
                        <span className="text-[10px] font-mono leading-tight">{cniFile} ✓</span>
                        <span className="text-[9px] text-emerald-500">{lang === 'fr' ? 'Changer' : 'Re-upload'}</span>
                      </>
                    ) : (
                      <>
                        <Camera className="text-slate-500" size={24} />
                        <span className="text-[11px] font-bold text-slate-350">{lang === 'fr' ? 'Déposer la pièce CNI' : 'Drop CNI Photo'}</span>
                        <span className="text-[9px] text-slate-500">{lang === 'fr' ? 'Poids max. 5Mo' : 'Click to simulate'}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Selfie Upload Box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "Photo de face (Selfie)" : "Face Photo (Selfie Match)"}</label>
                  <div 
                    onClick={() => setSelfieFile(prenom ? `SELFIE_${prenom.toUpperCase()}.png` : "SELFIE_RIDER.png")}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition select-none flex flex-col items-center justify-center gap-2 ${
                      selfieFile 
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                        : 'bg-theme-input border-theme-border hover:border-slate-700'
                    }`}
                  >
                    {selfieFile ? (
                      <>
                        <CheckCircle2 size={24} className="text-emerald-400" />
                        <span className="text-[10px] font-mono leading-tight">{selfieFile} ✓</span>
                        <span className="text-[9px] text-emerald-500">{lang === 'fr' ? 'Changer' : 'Re-upload'}</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="text-slate-500" size={24} />
                        <span className="text-[11px] font-bold text-slate-350">{lang === 'fr' ? 'Prendre un selfie' : 'Take a Selfie Match'}</span>
                        <span className="text-[9px] text-slate-500">{lang === 'fr' ? 'Éclairage dégagé' : 'Click to simulate'}</span>
                      </>
                    )}
                  </div>
                </div>

              </div>

              <div className="pt-3">
                <button
                  onClick={handleSaveKyc}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-450 hover:to-orange-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{lang === 'fr' ? 'Suivant : Type de véhicule' : 'Continue: Vehicle Selection'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* --- STEP 3: Vehicle selection & plates --- */}
          {onboardingStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-orange-500/5 border border-orange-500/15 rounded-2xl flex items-start gap-3">
                <Truck className="text-orange-400 mt-0.5 shrink-0" size={18} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{lang === 'fr' ? "Étape 3 : Spécification de Transport" : "Step 3: Transport Specification"}</h4>
                  <p className="text-[11px] text-theme-text-secondary leading-normal">
                    {lang === 'fr' 
                      ? "Choisissez votre catégorie de véhicule. Seules les motos & voitures demandent obligatoirement une assurance routière valide et une plaque d'immatriculation."
                      : "Choose your transit category. Moto & Voiture options require plate numbers and insurance copy approvals."}
                  </p>
                </div>
              </div>

              {/* Choice grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'velo', labelFr: 'Vélo 🚲', labelEn: 'Bicycle 🚲' },
                  { id: 'moto', labelFr: 'Moto 🏍️', labelEn: 'Motorcycle 🏍' },
                  { id: 'voiture', labelFr: 'Voiture 🚗', labelEn: 'Car 🚗' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setVehicleType(item.id as any)}
                    className={`py-3.5 rounded-2xl border font-bold text-xs select-none transition-all cursor-pointer ${
                      vehicleType === item.id
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5'
                        : 'bg-theme-input border-theme-border hover:border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'fr' ? item.labelFr : item.labelEn}
                  </button>
                ))}
              </div>

              {/* Conditional parameters */}
              {vehicleType !== 'velo' ? (
                <div className="space-y-4 pt-1 animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">
                      {lang === 'fr' ? "Plaque d'immatriculation (Ex: DK-1234-A)" : "License Plate Number (Ex: DK-1234-A)"}
                    </label>
                    <input
                      type="text"
                      placeholder="DK-9812-B"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full bg-theme-input border border-theme-border outline-none rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 placeholder-slate-500 font-mono upper"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Insurance file copy */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "Copie Assurance Routière" : "Roadway Insurance File"}</label>
                      <div 
                        onClick={() => setInsuranceFile("INSURANCE_POLICY_ALGS.pdf")}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition select-none flex flex-col items-center justify-center gap-2 ${
                          insuranceFile 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                            : 'bg-theme-input border-theme-border hover:border-slate-700'
                        }`}
                      >
                        {insuranceFile ? (
                          <>
                            <CheckCircle2 size={24} className="text-emerald-400" />
                            <span className="text-[10px] font-mono leading-tight">{insuranceFile} ✓</span>
                          </>
                        ) : (
                          <>
                            <FileText className="text-slate-500" size={24} />
                            <span className="text-[11px] font-bold text-slate-350">{lang === 'fr' ? 'Assurance (PDF)' : 'Attach Insurance'}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Vehicle photo Copy */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white uppercase tracking-wider">{lang === 'fr' ? "Photo du Véhicule" : "Vehicle Profile Photo"}</label>
                      <div 
                        onClick={() => setVehicleFile(`PHOTO_${vehicleType.toUpperCase()}_RIDER.png`)}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition select-none flex flex-col items-center justify-center gap-2 ${
                          vehicleFile 
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                            : 'bg-theme-input border-theme-border hover:border-slate-700'
                        }`}
                      >
                        {vehicleFile ? (
                          <>
                            <CheckCircle2 size={24} className="text-emerald-400" />
                            <span className="text-[10px] font-mono leading-tight">{vehicleFile} ✓</span>
                          </>
                        ) : (
                          <>
                            <Camera className="text-slate-500" size={24} />
                            <span className="text-[11px] font-bold text-slate-350">{lang === 'fr' ? 'Photo du véhicule' : 'Attach Vehicle Pic'}</span>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#12131a] border border-slate-800 rounded-2xl text-[11px] text-slate-400 leading-normal flex items-start gap-1.5 animate-fade-in">
                  <Info size={14} className="text-orange-400 shrink-0 mt-0.5" />
                  <span>
                    {lang === 'fr'
                      ? "🚲 Mode Vélo Écologique : Aucune d'immatriculation ni d'assurance n'est requise. Prêt pour un rayon d'action maximal de 3km."
                      : "🚲 Eco-Bicycle Category: No registration plate or insurance needed. Tailored for a max proximity match of 3km."}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer flex-1"
                >
                  {lang === 'fr' ? 'Retour' : 'Previous'}
                </button>
                <button
                  onClick={handleSaveVehicle}
                  className="py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-450 hover:to-orange-500 text-white rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer flex-1 flex items-center justify-center gap-1.5"
                >
                  <span>{lang === 'fr' ? 'Suivant : Test Théorique' : 'Continue: Training Quiz'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* --- STEP 4: Onboarding Quick Test --- */}
          {onboardingStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-orange-500/5 border border-orange-500/15 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="text-orange-400 mt-0.5 shrink-0" size={18} />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">{lang === 'fr' ? "Étape 4 : Règles de Sécurité & Test" : "Step 4: Safety Test & Regulations"}</h4>
                  <p className="text-[11px] text-theme-text-secondary leading-normal">
                    {lang === 'fr'
                      ? "Lisez attentivement ces règles fondamentales puis répondez aux 5 questions ci-dessous pour activer automatiquement votre compte (Seuil de passage : 80% / 4 réponses correctes)."
                      : "Review the following delivery code of conduct and achieve a score >= 80% (4/5 answers) to trigger automatic login approval!"}
                  </p>
                </div>
              </div>

              {/* Study material box */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-wider block font-mono">
                  {lang === 'fr' ? "📖 GUIDE DU LIVREUR ALGS EN 3 RECOMMANDATIONS :" : "📖 DISPATCH CONDUCT IN 3 MANDATES:"}
                </span>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed font-sans">
                  <li><strong>{lang === 'fr' ? "Sécurité d'abord :" : "Safety First:"}</strong> {lang === 'fr' ? "Pas d'excès de vitesse. Les motocyclistes doivent porter un casque attaché." : "No speeding. Delivery riders must always wear standard secured safety helmets."}</li>
                  <li><strong>{lang === 'fr' ? "Bypass Intelligent (Bouchons) :" : "Fluid Bypassing detours:"}</strong> {lang === 'fr' ? "L'algorithme OSRM vous dessine une ligne solide verte de détour dès qu'une congestion dépasse 1.5km. Suivez-la !" : "The system renders a solid bright green route whenever bottlenecks block your path. Use it!"}</li>
                  <li><strong>{lang === 'fr' ? "Telemétrie continue :" : "Permanent GPS Sync:"}</strong> {lang === 'fr' ? "Garder l'application ouverte. Si le GPS coupe, vous risquez une amende ou d'être déconnecté." : "Keep GPS active. Disconnections stop client real-time tracking updates."}</li>
                </ul>
              </div>

              {/* Questions wrapper */}
              {!examResult ? (
                <div className="space-y-5 pt-2">
                  {TRAINING_QUESTIONS.map((q, idx) => {
                    const selectedOpt = examAnswers[q.id];
                    return (
                      <div key={q.id} className="p-4 bg-[#12131a] rounded-2xl border border-slate-800 space-y-3">
                        <span className="text-[10px] font-bold text-orange-400 font-mono uppercase tracking-wide block">
                          Question {idx + 1} / 5
                        </span>
                        <h4 className="text-xs font-bold text-white leading-relaxed">
                          {lang === 'fr' ? q.questionFr : q.questionEn}
                        </h4>
                        <div className="space-y-2 pt-1">
                          {(lang === 'fr' ? q.optionsFr : q.optionsEn).map((opt, optIdx) => {
                            const isSelected = selectedOpt === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectAnswer(q.id, optIdx)}
                                className={`w-full text-left p-3 rounded-xl border text-xs leading-normal transition-all duration-200 select-none cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                }`}
                              >
                                <span className="flex-1 pr-2">{opt}</span>
                                <span className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center text-[9px] ${
                                  isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-700'
                                }`}>
                                  {isSelected && "✓"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setOnboardingStep(3)}
                      className="py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition cursor-pointer flex-1"
                    >
                      {lang === 'fr' ? 'Retour' : 'Previous'}
                    </button>
                    <button
                      onClick={handleSubmitExam}
                      className="py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-450 hover:to-orange-500 text-white rounded-2xl text-xs font-black transition shadow-lg cursor-pointer flex-1 flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> {lang === 'fr' ? 'Soumettre mes réponses' : 'Submit Exam'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Exam Results Card */
                <div className="space-y-5 pt-2 animate-fade-in text-center">
                  <div className={`p-6 rounded-2xl border ${
                    examResult.passed 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/5 border-red-500/20 text-red-400'
                  } space-y-3`}>
                    <div className="flex justify-center">
                      <div className={`p-3 rounded-full ${examResult.passed ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        {examResult.passed ? <CheckCircle2 size={40} /> : <AlertCircle size={40} />}
                      </div>
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-white">
                      {examResult.passed 
                        ? (lang === 'fr' ? 'Test d\'Onboarding Réussi ! ✓' : 'Onboarding Test Passed! ✓')
                        : (lang === 'fr' ? 'Onboarding non validé ✕' : 'Test Score Insufficient ✕')}
                    </h3>
                    <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                      {examResult.passed
                        ? (lang === 'fr' 
                            ? `Vous avez obtenu un score parfait de ${examResult.score}% ! Votre identité est validée et votre compte est passé au statut "APPROUVÉ".`
                            : `You scored ${examResult.score}%! Your ID documents and background rules are approved. You are ready to go online!`)
                        : (lang === 'fr'
                            ? `Votre score est de ${examResult.score}%. Le seuil requis est de 80% (4 réponses correctes). Veuillez réétudier le guide et recommencer.`
                            : `You scored ${examResult.score}%. Our standard threshold is at least 80% correct answers. Please try again!`)}
                    </p>
                    <div className="font-mono text-2xl font-black text-white">
                      {examResult.score}%
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!examResult.passed ? (
                      <button
                        onClick={handleRetryExam}
                        className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw size={14} /> {lang === 'fr' ? 'Recommencer le Quiz' : 'Retry Quiz'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setCurrentMode('telemetry');
                          fetchDriverStatus(livreurId);
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-450 hover:to-emerald-500 text-white font-extrabold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Truck size={14} />
                        {lang === 'fr' ? 'Accéder à l\'Espace Course' : 'Enter Delivery Environment'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 📟 Debug/Telemetry live logger stream terminal panel */}
      <div className="bg-[#12131a] p-5 rounded-3xl border border-theme-border space-y-3 font-mono">
        <div className="flex justify-between items-center text-[10px] text-theme-text-muted font-bold tracking-wider uppercase border-b border-theme-border-thin pb-2">
          <span>{lang === 'fr' ? '📟 Logs Télémétrie en live' : '📟 Live Telemetry Logs'}</span>
          <span className="text-emerald-500 animate-pulse bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20 rounded">
            ACTIVE
          </span>
        </div>
        <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar text-[10px] leading-relaxed text-slate-400">
          {debugLog.length > 0 ? (
            debugLog.map((log, idx) => (
              <div key={idx} className="flex gap-1.5">
                <span className="text-theme-text-muted shrink-0">&gt;</span>
                <span>{log}</span>
              </div>
            ))
          ) : (
            <div className="text-theme-text-muted italic">
              {lang === 'fr' ? 'En attente d’activité...' : 'Waiting for activity...'}
            </div>
          )}
        </div>
      </div>

      {/* 🚀 ADMIN EXPERIMENTAL CONTROLS FOR AI STUDIO EVALUATION */}
      <div className="bg-slate-900/50 border border-theme-border p-4 rounded-3xl space-y-3">
        <div className="flex items-center gap-1.5 text-orange-450">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-bold font-sans tracking-wider uppercase text-slate-300">
            {lang === 'fr' ? '🛠️ Panneau Simulateur d\'Administration' : '🛠️ Administrative Simulation Panel'}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          {lang === 'fr'
            ? "Pour fluidifier vos essais, vous pouvez forcer immédiatement l'approbation KYC du livreur actif par bypass sans passer le test."
            : "To streamline evaluation, instantly toggle KYC statuses or force approvals with 1-click bypass controls."}
        </p>
        <div className="flex flex-wrap gap-2 pt-1.5">
          <button
            onClick={() => handleAdminBypassApproval('approved')}
            className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
          >
            {lang === 'fr' ? 'Forcer Approbation ✓' : 'Force KYC Approved ✓'}
          </button>
          <button
            onClick={() => handleAdminBypassApproval('pending')}
            className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/15 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
          >
            {lang === 'fr' ? 'Forcer attente ⧗' : 'Force KYC Pending ⧗'}
          </button>
        </div>
      </div>

    </div>
  );
}
