export interface TranslationSchema {
  appName: string;
  menu: {
    home: string;
    about: string;
    donate: string;
    roadmap: string;
    privacy: string;
  };
  about: {
    title: string;
    whyTitle: string;
    whyText: string;
    problemTitle: string;
    problems: string[];
    solutionTitle: string;
    solutionText: string;
    forWhoTitle: string;
    forWho: string[];
  };
  donate: {
    title: string;
    whyTitle: string;
    whyText: string;
    benefits: string[];
    howTitle: string;
    howText: string;
    whereTitle: string;
    number: string;
    note: string;
  };
  roadmap: {
    title: string;
    whyTitle: string;
    whyText: string;
    freeTitle: string;
    freeFeatures: string[];
    proTitle: string;
    proFeatures: string[];
    phaseTitle: string;
    phases: string[];
  };
  home: {
    title: string;
    subtitle: string;
    clientTab: string;
    driverTab: string;
    client: {
      title: string;
      myPhone: string;
      driverPhone: string;
      shareBtn: string;
      loading: string;
      note: string;
      error: string;
      gpsError: string;
    };
    driver: {
      title: string;
      myPhone: string;
      clientPhone: string;
      shareBtn: string;
      loading: string;
      note: string;
      error: string;
      gpsError: string;
    };
  };
}

export const translations: Record<'fr' | 'en', TranslationSchema> = {
  fr: {
    appName: "ALGS Live",
    menu: {
      home: "Accueil",
      about: "À propos",
      donate: "Soutenir",
      roadmap: "Avenir",
      privacy: "Confidentialité"
    },
    about: {
      title: "ALGS Live - Livrez sans vous perdre",
      whyTitle: "Pourquoi on a créé ALGS",
      whyText: "Aujourd’hui, 8 livreurs sur 10 perdent du temps à appeler le client pour trouver l’adresse. Résultat : retard, colis égarés, clients énervés.",
      problemTitle: "Le problème constaté",
      problems: [
        "Le client ne sait pas expliquer où il habite",
        "Le livreur se repère avec des repères de quartier qui changent tout le temps",
        "Les appels répétés coûtent du temps et de l’argent",
        "Pas de suivi en temps réel pour le client"
      ],
      solutionTitle: "La solution ALGS",
      solutionText: "ALGS Live règle ça en 1 clic. Le client partage sa position GPS exacte via WhatsApp. Le livreur reçoit un lien Google Maps et suit l’itinéraire direct.",
      forWhoTitle: "Pour qui",
      forWho: ["Particuliers", "Livreurs indépendants", "Petites entreprises, boutiques en ligne"]
    },
    donate: {
      title: "Soutenez le développement d’ALGS Live",
      whyTitle: "Pourquoi faire un don",
      whyText: "ALGS est gratuit aujourd’hui. Votre don permet de garder l’app rapide, sans bug, et d’ajouter des fonctionnalités.",
      benefits: [
        "Garder l’app gratuite pour les particuliers",
        "Ajouter le suivi en temps réel et les notifications",
        "Développer la version pro pour entreprises"
      ],
      howTitle: "Comment faire un don",
      howText: "C’est simple, rapide et 100% sécurisé via Orange Money.",
      whereTitle: "Où faire le don",
      number: "Orange Money : +221 78 146 64 21",
      note: "Après le don, envoie 'ALGS' par WhatsApp au même numéro pour recevoir un message de remerciement."
    },
    roadmap: {
      title: "L’avenir d’ALGS - Roadmap",
      whyTitle: "Pourquoi ça va devenir payant",
      whyText: "Pour aller plus loin, il faut une équipe et des serveurs solides. Dans quelques mois, ALGS passera en modèle freemium.",
      freeTitle: "Gratuit pour toujours",
      freeFeatures: ["Partage de position basique", "Ouverture Google Maps", "Version client/livreur actuelle"],
      proTitle: "Version Payante - ALGS Pro",
      proFeatures: [
        "Suivi en temps réel de la position",
        "Historique des livraisons",
        "Notifications push",
        "Multi-livreurs pour entreprises",
        "Sans pub"
      ],
      phaseTitle: "Où en sommes-nous",
      phases: [
        "Phase 1 : App de base fonctionnelle",
        "Phase 2 : Suivi temps réel en cours",
        "Phase 3 : Lancement ALGS Pro pour entreprises"
      ]
    },
    home: {
      title: "ALGS Live",
      subtitle: "Partagez votre position via WhatsApp",
      clientTab: "Espace Client",
      driverTab: "Espace Livreur",
      client: {
        title: "Interface Client",
        myPhone: "Mon numéro WhatsApp (Recommandé)",
        driverPhone: "Numéro de téléphone du livreur",
        shareBtn: "Partager ma position GPS",
        loading: "Calcul du GPS en cours...",
        note: "Cette action récupère votre position satellite exacte pour la transmettre via WhatsApp.",
        error: "⚠️ Le numéro de téléphone du livreur est requis.",
        gpsError: "Impossible de déterminer votre localisation GPS. Assurez-vous que l'accès GPS est autorisé."
      },
      driver: {
        title: "Interface Livreur",
        myPhone: "Mon numéro WhatsApp (Livreur - Recommandé)",
        clientPhone: "Numéro de téléphone du client",
        shareBtn: "Envoyer ma position au client",
        loading: "Identification GPS...",
        note: "Cette action envoie vos coordonnées réelles pour que le client active l'itinéraire Google Maps.",
        error: "⚠️ Le numéro de téléphone du client est requis.",
        gpsError: "Erreur de calcul GPS. Vérifiez que les autorisations de localisation mobile sont actives."
      }
    }
  },
  en: {
    appName: "ALGS Live",
    menu: {
      home: "Home",
      about: "About Us",
      donate: "Support Us",
      roadmap: "Future",
      privacy: "Privacy Policy"
    },
    about: {
      title: "ALGS Live - Deliver without getting lost",
      whyTitle: "Why we created ALGS",
      whyText: "Today, 8 out of 10 delivery drivers waste time calling clients to find the address. Result: delays, lost packages, frustrated customers.",
      problemTitle: "The problem we found",
      problems: [
        "Clients can’t explain where they live",
        "Drivers rely on landmarks that keep changing",
        "Repeated calls waste time and money",
        "No real-time tracking for customers"
      ],
      solutionTitle: "The ALGS solution",
      solutionText: "ALGS Live fixes this in 1 click. The client shares their exact GPS location via WhatsApp. The driver gets a Google Maps link and follows the route directly.",
      forWhoTitle: "For who",
      forWho: ["Individuals", "Independent delivery drivers", "Small businesses, online shops"]
    },
    donate: {
      title: "Support ALGS Live development",
      whyTitle: "Why donate",
      whyText: "ALGS is free today. Your donation keeps the app fast, bug-free, and helps add new features.",
      benefits: [
        "Keep the app free for individuals",
        "Add real-time tracking and notifications",
        "Build the pro version for businesses"
      ],
      howTitle: "How to donate",
      howText: "It’s simple, fast and 100% secure via Orange Money.",
      whereTitle: "Where to donate",
      number: "Orange Money: +221 78 146 64 21",
      note: "After donating, send 'ALGS' on WhatsApp to the same number to get a thank you message."
    },
    roadmap: {
      title: "The future of ALGS - Roadmap",
      whyTitle: "Why it will become paid",
      whyText: "To go further, we need a team and solid servers. In a few months, ALGS will switch to a freemium model.",
      freeTitle: "Free forever",
      freeFeatures: ["Basic location sharing", "Google Maps opening", "Current client/driver version"],
      proTitle: "Paid version - ALGS Pro",
      proFeatures: [
        "Real-time location tracking",
        "Delivery history",
        "Push notifications",
        "Multi-driver for businesses",
        "Ad-free"
      ],
      phaseTitle: "Where we are",
      phases: [
        "Phase 1: Basic app functional",
        "Phase 2: Real-time tracking in progress",
        "Phase 3: ALGS Pro launch for businesses"
      ]
    },
    home: {
      title: "ALGS Live",
      subtitle: "Share your location via WhatsApp",
      clientTab: "Client Area",
      driverTab: "Driver Area",
      client: {
        title: "Client Interface",
        myPhone: "My WhatsApp Number (Recommended)",
        driverPhone: "Delivery Driver's Phone Number",
        shareBtn: "Share my GPS Location",
        loading: "Calculating GPS...",
        note: "This action retrieves your exact satellite coordinates to share via WhatsApp.",
        error: "⚠️ Driver's phone number is required.",
        gpsError: "Unable to retrieve your GPS location. Please ensure location access is enabled."
      },
      driver: {
        title: "Driver Interface",
        myPhone: "My WhatsApp Number (Driver - Recommended)",
        clientPhone: "Client's Phone Number",
        shareBtn: "Send my Location to Client",
        loading: "Locating GPS...",
        note: "This action sends your coordinates so the client can follow you on Google Maps.",
        error: "⚠️ Client's phone number is required.",
        gpsError: "GPS calculation error. Check that mobile location permissions are enabled."
      }
    }
  }
};
