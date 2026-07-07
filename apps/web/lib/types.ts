import type {
  Disponibilite,
  StatutContrat,
  StatutFacture,
  StatutLivrable,
  StatutMission,
  StatutSousTraitant,
  TypeDocumentAdministratif,
  TypeNotification,
} from "@gst/shared-types";

export interface OrgMember {
  id: string;
  email: string;
  nom: string;
  role: string;
  dateCreation: string;
}

export interface ContractorDirectoryEntry {
  id: string;
  userId: string;
  nom: string;
  email: string;
  competences: string[];
  tarifJour: string | null;
  tarifHeure: string | null;
  disponibilite: Disponibilite;
  statut: StatutSousTraitant;
  noteMoyenne: string | null;
}

export interface AdminDocument {
  id: string;
  type: TypeDocumentAdministratif;
  fichierUrl: string;
  dateExpiration: string | null;
  dateUpload: string;
}

export interface ContractorProfileDetail {
  id: string;
  userId: string;
  competences: string[];
  tarifJour: string | null;
  tarifHeure: string | null;
  disponibilite: Disponibilite;
  statut: StatutSousTraitant;
  noteMoyenne: string | null;
  user: { id: string; nom: string; email: string };
  documents: AdminDocument[];
}

export interface MissionListItem {
  id: string;
  titre: string;
  statut: StatutMission;
  clientFinal: string | null;
  dateEcheance: string | null;
  budgetPrevu: string | null;
  tarifConvenu: string | null;
  sousTraitant: { id: string; nom: string; email: string } | null;
  organization?: { nom: string };
}

export interface MissionComment {
  id: string;
  contenu: string;
  dateCreation: string;
  auteur: { id: string; nom: string; role: string };
}

export interface BriefFile {
  id: string;
  fichierUrl: string;
  nomFichier: string;
}

export interface MissionDetail extends MissionListItem {
  descriptionBrief: string | null;
  dateDebut: string | null;
  dateCreation: string;
  organizationId: string;
  brief: { id: string; contenuTexte: string | null; fichiers: BriefFile[] } | null;
  commentaires: MissionComment[];
}

export interface Contract {
  id: string;
  missionId: string;
  templateUtilise: string;
  fichierPdfGenere: string | null;
  fichierSigneUrl: string | null;
  statut: StatutContrat;
  dateEnvoi: string | null;
  dateSignature: string | null;
  dateCreation: string;
  mission?: { titre: string; sousTraitantId?: string | null };
}

export interface Deliverable {
  id: string;
  missionId: string;
  version: number;
  fichierOuLien: string;
  commentaireSousTraitant: string | null;
  statut: StatutLivrable;
  commentaireValidation: string | null;
  dateSoumission: string;
}

export interface Invoice {
  id: string;
  missionId: string;
  sousTraitantId: string;
  montant: string;
  fichierFacture: string;
  statut: StatutFacture;
  dateReception: string;
  datePaiementPrevue: string | null;
  datePaiementReel: string | null;
  mission?: { titre: string };
  sousTraitant?: { nom: string; email: string };
}

export interface AppNotification {
  id: string;
  type: TypeNotification;
  contenu: string;
  lu: boolean;
  dateCreation: string;
}
