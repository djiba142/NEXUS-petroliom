// Types for SIHG System

export type StockLevel = 'critical' | 'warning' | 'healthy' | 'full';

export type UserRole = 'super_admin' | 'admin_etat' | 'inspecteur' | 'responsable_entreprise' | 'gestionnaire_station';

export type EntrepriseType = 'compagnie' | 'distributeur';

export type StationType = 'urbaine' | 'routiere' | 'depot' | string;  // ← élargi pour Supabase

export type AlertType = 'stock_critical' | 'stock_warning' | 'price_anomaly' | 'station_closed';

export type StationStatus = 'ouverte' | 'fermee' | 'en_travaux' | 'attente_validation' | string;  // ← élargi

export interface Entreprise {
  id: string;
  nom: string;
  sigle: string;
  type: EntrepriseType;
  numeroAgrement: string;
  region: string;
  statut: 'actif' | 'suspendu' | 'ferme';
  nombreStations: number;
  logo?: string;
  contact: {
    nom: string;
    telephone: string;
    email: string;
  };
}

export interface Station {
  id: string;
  nom: string;
  code: string;
  adresse: string;
  ville: string;
  region: string;
  coordonnees?: { lat: number; lng: number };
  type: StationType;          // ← maintenant compatible avec n'importe quelle string
  entrepriseId: string;
  entrepriseNom: string;
  capacite: {
    essence: number;
    gasoil: number;
    gpl: number;
    lubrifiants: number;
  };
  stockActuel: {
    essence: number;
    gasoil: number;
    gpl: number;
    lubrifiants: number;
  };
  nombrePompes: number;
  gestionnaire: {
    nom: string;
    telephone: string;
    email: string;
  };
  statut: StationStatus;      // ← maintenant compatible avec n'importe quelle string
  derniereLivraison?: {
    date: string;
    quantite: number;
    carburant: string;
  };
}

export interface Alert {
  id: string;
  type: AlertType;
  stationId: string;
  stationNom: string;
  entrepriseNom: string;
  message: string;
  niveau: 'critique' | 'alerte';
  dateCreation: string;
  resolu: boolean;
}

export interface DashboardStats {
  totalEntreprises: number;
  totalStations: number;
  stationsActives: number;
  alertesCritiques: number;
  alertesWarning: number;
  stockNationalEssence: number;
  stockNationalGasoil: number;
}