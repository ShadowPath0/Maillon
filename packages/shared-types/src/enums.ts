export const Role = {
  ADMIN: "ADMIN",
  MEMBRE: "MEMBRE",
  SOUS_TRAITANT: "SOUS_TRAITANT",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Disponibilite = {
  DISPONIBLE: "DISPONIBLE",
  OCCUPE: "OCCUPE",
  INDISPONIBLE: "INDISPONIBLE",
} as const;
export type Disponibilite = (typeof Disponibilite)[keyof typeof Disponibilite];

export const StatutSousTraitant = {
  ACTIF: "ACTIF",
  INACTIF: "INACTIF",
} as const;
export type StatutSousTraitant = (typeof StatutSousTraitant)[keyof typeof StatutSousTraitant];

export const TypeDocumentAdministratif = {
  KBIS: "KBIS",
  ATTESTATION_URSSAF: "ATTESTATION_URSSAF",
  ATTESTATION_ASSURANCE: "ATTESTATION_ASSURANCE",
  RIB: "RIB",
  AUTRE: "AUTRE",
} as const;
export type TypeDocumentAdministratif = (typeof TypeDocumentAdministratif)[keyof typeof TypeDocumentAdministratif];

export const StatutMission = {
  BRIEF_ENVOYE: "BRIEF_ENVOYE",
  EN_COURS: "EN_COURS",
  LIVRE: "LIVRE",
  EN_VALIDATION: "EN_VALIDATION",
  VALIDE: "VALIDE",
  REJETE: "REJETE",
} as const;
export type StatutMission = (typeof StatutMission)[keyof typeof StatutMission];

export const StatutContrat = {
  BROUILLON: "BROUILLON",
  ENVOYE: "ENVOYE",
  SIGNE: "SIGNE",
} as const;
export type StatutContrat = (typeof StatutContrat)[keyof typeof StatutContrat];

export const StatutLivrable = {
  SOUMIS: "SOUMIS",
  VALIDE: "VALIDE",
  REJETE: "REJETE",
} as const;
export type StatutLivrable = (typeof StatutLivrable)[keyof typeof StatutLivrable];

export const StatutFacture = {
  RECUE: "RECUE",
  A_PAYER: "A_PAYER",
  PAYEE: "PAYEE",
  EN_RETARD: "EN_RETARD",
} as const;
export type StatutFacture = (typeof StatutFacture)[keyof typeof StatutFacture];

export const TypeNotification = {
  MISSION_ASSIGNEE: "MISSION_ASSIGNEE",
  LIVRABLE_SOUMIS: "LIVRABLE_SOUMIS",
  LIVRABLE_VALIDE: "LIVRABLE_VALIDE",
  LIVRABLE_REJETE: "LIVRABLE_REJETE",
  FACTURE_EN_RETARD: "FACTURE_EN_RETARD",
  DOCUMENT_EXPIRE_BIENTOT: "DOCUMENT_EXPIRE_BIENTOT",
  CONTRAT_ENVOYE: "CONTRAT_ENVOYE",
  CONTRAT_SIGNE: "CONTRAT_SIGNE",
  INVITATION_MEMBRE: "INVITATION_MEMBRE",
  INVITATION_SOUS_TRAITANT: "INVITATION_SOUS_TRAITANT",
} as const;
export type TypeNotification = (typeof TypeNotification)[keyof typeof TypeNotification];

export const PlanAbonnement = {
  ESSAI: "ESSAI",
  STARTER: "STARTER",
  PRO: "PRO",
} as const;
export type PlanAbonnement = (typeof PlanAbonnement)[keyof typeof PlanAbonnement];
