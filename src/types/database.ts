export type ProspectStatut =
  | "en_attente"
  | "envoye"
  | "repondu"
  | "rdv"
  | "refus";

export type ProspectTemperature = "froid" | "tiede" | "chaud" | "brulant";

export type CampagneStatut = "active" | "pause" | "terminee";

export type MessageDirection = "entrant" | "sortant";

export interface Prospect {
  id: string;
  nom: string;
  societe: string | null;
  telephone: string;
  activite: string | null;
  ville: string | null;
  statut: ProspectStatut;
  temperature: ProspectTemperature;
  campagne_id: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  prospect_id: string;
  message: string;
  direction: MessageDirection;
  timestamp: string;
}

export interface Campagne {
  id: string;
  nom: string;
  nb_envois_par_jour: number;
  statut: CampagneStatut;
  created_at: string;
}
