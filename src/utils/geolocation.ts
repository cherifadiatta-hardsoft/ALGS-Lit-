/**
 * Utility functions for browser Geolocation and Google Maps
 */

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export type GeolocationErrorType = 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';

export class GeolocationError extends Error {
  type: GeolocationErrorType;
  
  constructor(type: GeolocationErrorType, message: string) {
    super(message);
    this.name = 'GeolocationError';
    this.type = type;
  }
}

/**
 * Gets the current GPS location with high accuracy
 */
export const getCurrentPosition = (timeoutMs = 15000): Promise<GeolocationResult> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new GeolocationError('UNKNOWN', "La géolocalisation n'est pas supportée par votre navigateur."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let type: GeolocationErrorType = 'UNKNOWN';
        let msg = "Une erreur inconnue est survenue lors de la récupération GPS.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            type = 'PERMISSION_DENIED';
            msg = "Autorisation d'accès au GPS refusée. Veuillez activer la localisation dans vos paramètres de navigateur.";
            break;
          case error.POSITION_UNAVAILABLE:
            type = 'POSITION_UNAVAILABLE';
            msg = "Les informations de localisation ne sont pas disponibles pour le moment.";
            break;
          case error.TIMEOUT:
            type = 'TIMEOUT';
            msg = "Le délai d'attente pour obtenir votre position GPS a expiré. Réessayez en extérieur.";
            break;
        }
        reject(new GeolocationError(type, msg));
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Generates a standard Google Maps link using latitude and longitude
 */
export const createGoogleMapsLink = (lat: number, lng: number): string => {
  return `https://maps.google.com/?q=${lat},${lng}`;
};
