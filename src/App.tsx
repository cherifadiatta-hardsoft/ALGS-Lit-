import { useState } from 'react';
import { 
  User, 
  Truck, 
  Compass, 
  MapPin, 
  MessageSquare, 
  BookOpen, 
  HelpCircle,
  Clock,
  Navigation,
  ArrowRight
} from 'lucide-react';
import ClientTab from './components/ClientTab';
import DriverTab from './components/DriverTab';

type TabType = 'client' | 'driver';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('client');
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0e1017] via-[#0b0c10] to-[#07080b] px-4 py-8 flex flex-col justify-between selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Centered Main Layout Block */}
      <div className="w-full max-w-md mx-auto space-y-7">
        
        {/* Header Section */}
        <header className="text-center space-y-2 mt-2">
          <div className="inline-flex items-center gap-2 border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider text-blue-400 uppercase select-none">
            <Navigation size={12} className="text-blue-400 rotate-45 animate-pulse" />
            Algs Geolocation App
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            ALGS<span className="text-blue-500 text-3xl font-light">.</span>
          </h1>
          <p className="text-gray-400 text-xs font-medium max-w-[280px] mx-auto leading-relaxed">
            Partagez votre position GPS de haute précision instantanément sur WhatsApp.
          </p>
        </header>

        {/* Tab Selection Segments */}
        <div className="bg-gray-900/60 p-1 rounded-2xl border border-gray-800 flex gap-2.5 shadow-xl backdrop-blur-md">
          <button
            id="tab-client-btn"
            onClick={() => {
              setActiveTab('client');
              setErrorStateAndSuccessClear();
            }}
            className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-300 ${
              activeTab === 'client'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
            }`}
          >
            <User size={15} />
            Espace Client
          </button>
          
          <button
            id="tab-driver-btn"
            onClick={() => {
              setActiveTab('driver');
              setErrorStateAndSuccessClear();
            }}
            className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-300 ${
              activeTab === 'driver'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/20'
            }`}
          >
            <Truck size={15} />
            Espace Livreur
          </button>
        </div>

        {/* Dynamic Inner Tab Component View */}
        <main className="min-h-[380px]">
          {activeTab === 'client' ? <ClientTab /> : <DriverTab />}
        </main>

        {/* Interactive Guide Collapse */}
        <div className="bg-gray-950/60 rounded-3xl border border-gray-900 overflow-hidden transition-all duration-300">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-900/40 transition-colors"
          >
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={14} className="text-blue-400" />
              Comment ça fonctionne ?
            </span>
            <HelpCircle size={16} className={`text-gray-500 transition-transform ${showHelp ? 'rotate-180 text-blue-400' : ''}`} />
          </button>
          
          {showHelp && (
            <div className="px-5 pb-5 pt-1 space-y-4 border-t border-gray-900/60 text-xs text-gray-400 leading-relaxed">
              <div className="space-y-3">
                <p className="font-semibold text-gray-300 text-[11px] uppercase tracking-wider">🔄 Flux Client (Partage vers Livreur) :</p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>Saisissez le <strong>numéro du livreur</strong> (au format international, ex: <span className="font-mono text-blue-400">221782632977</span>).</li>
                  <li>Cliquez sur <strong>Partager ma position GPS</strong>.</li>
                  <li>L'application calcule vos coordonnées GPS satellites et ouvre automatiquement WhatsApp avec un message prérempli.</li>
                  <li>Le livreur clique sur le lien et ouvre <strong>Google Maps</strong> directement pour vous livrer de manière fluide.</li>
                </ol>
              </div>

              <div className="space-y-3 pt-2">
                <p className="font-semibold text-gray-300 text-[11px] uppercase tracking-wider">🏁 Flux Livreur (Partage vers Client) :</p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>Saisissez le <strong>numéro du client</strong> (ex: <span className="font-mono text-emerald-400">22177XXXXXXX</span>).</li>
                  <li>Cliquez sur <strong>Envoyer ma position au client</strong>.</li>
                  <li>Votre position satellite est transmise directement au client par WhatsApp, lui permettant de vous localiser sur l'itinéraire.</li>
                </ol>
              </div>

              <div className="p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[11px] mt-2">
                <p className="font-semibold text-blue-400">💡 Conseil d'utilisation :</p>
                <p className="mt-0.5">Autorisez l'emplacement GPS pour de meilleurs résultats de précision, de préférence en extérieur pour un calibrage optimal.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Element */}
      <footer className="w-full max-w-md mx-auto text-center mt-12 space-y-1">
        <p className="text-[11px] text-gray-600 font-mono tracking-wide">
          ALGS v1.0.0 • 100% Client-Side Local Storage
        </p>
        <p className="text-[10px] text-gray-700 leading-relaxed">
          Propulsé par la géolocalisation haute fidélité du navigateur mobile. Aucun partage de données serveur.
        </p>
      </footer>
    </div>
  );

  function setErrorStateAndSuccessClear() {
    // Dynamic cleanup helper on tab change
  }
}
